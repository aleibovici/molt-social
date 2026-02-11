import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMobileSession } from "@/lib/mobile-auth";
import { generateUniqueUsername } from "@/lib/username";
import { mobileTokenExchangeSchema, formatValidationError } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { withErrorHandling } from "@/lib/api-utils";

// ---------------------------------------------------------------------------
// Provider token verification
// ---------------------------------------------------------------------------

interface ProviderProfile {
  providerAccountId: string;
  email: string | null;
  name: string | null;
  image: string | null;
}

async function verifyGoogleToken(idToken: string): Promise<ProviderProfile | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.aud !== process.env.AUTH_GOOGLE_ID) return null;
    return {
      providerAccountId: data.sub,
      email: data.email ?? null,
      name: data.name ?? null,
      image: data.picture ?? null,
    };
  } catch {
    return null;
  }
}

async function verifyGithubToken(accessToken: string): Promise<ProviderProfile | null> {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    };
    const res = await fetch("https://api.github.com/user", { headers });
    if (!res.ok) return null;
    const data = await res.json();

    let email: string | null = data.email ?? null;
    if (!email) {
      const emailRes = await fetch("https://api.github.com/user/emails", { headers });
      if (emailRes.ok) {
        const emails: { email: string; primary: boolean; verified: boolean }[] =
          await emailRes.json();
        const primary = emails.find((e) => e.primary && e.verified);
        email = primary?.email ?? emails[0]?.email ?? null;
      }
    }

    return {
      providerAccountId: String(data.id),
      email,
      name: data.name ?? data.login ?? null,
      image: data.avatar_url ?? null,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST — Exchange provider token for a mobile session
// ---------------------------------------------------------------------------

async function _POST(req: Request) {
  const limited = checkRateLimit(req, "mobile-token-exchange", 5);
  if (limited) return limited;

  const body = await req.json();
  const parsed = mobileTokenExchangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatValidationError(parsed.error) },
      { status: 400 }
    );
  }

  const { provider, token } = parsed.data;

  // 1. Verify the provider token
  const profile =
    provider === "google"
      ? await verifyGoogleToken(token)
      : await verifyGithubToken(token);

  if (!profile) {
    return NextResponse.json(
      { error: "Invalid or expired provider token" },
      { status: 401 }
    );
  }

  // 2. Find existing account by (provider, providerAccountId)
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: { user: true },
  });

  let user;

  if (existingAccount) {
    user = existingAccount.user;
  } else {
    // 3. Check if a user with this email already exists (account linking)
    const existingUser = profile.email
      ? await prisma.user.findUnique({ where: { email: profile.email } })
      : null;

    if (existingUser) {
      // Link the new provider account to the existing user
      await prisma.account.create({
        data: {
          userId: existingUser.id,
          type: "oauth",
          provider,
          providerAccountId: profile.providerAccountId,
        },
      });
      user = existingUser;
    } else {
      // 4. Create a new user + account
      user = await prisma.user.create({
        data: {
          name: profile.name,
          email: profile.email,
          image: profile.image,
          accounts: {
            create: {
              type: "oauth",
              provider,
              providerAccountId: profile.providerAccountId,
            },
          },
        },
      });

      // Generate a username for the new user
      const username = await generateUniqueUsername(user.id, profile.name);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { username },
      });
    }
  }

  // 5. Create a mobile session
  const { sessionToken, expires } = await createMobileSession(user.id);

  return NextResponse.json({
    sessionToken,
    expiresAt: expires.toISOString(),
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      name: user.name,
      image: user.avatarUrl ?? user.image,
      role: user.role,
    },
  });
}
export const POST = withErrorHandling(_POST);

// ---------------------------------------------------------------------------
// DELETE — Logout (revoke mobile session)
// ---------------------------------------------------------------------------

async function _DELETE(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer mol_")) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const token = authHeader.slice(7);

  await prisma.session.deleteMany({
    where: { sessionToken: token },
  });

  return NextResponse.json({ success: true });
}
export const DELETE = withErrorHandling(_DELETE);
