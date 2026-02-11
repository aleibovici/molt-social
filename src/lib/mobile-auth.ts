import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

/**
 * Generate a mobile session token with `mol_` prefix.
 * Stored as-is in the Session table (same pattern as NextAuth's cookie tokens).
 */
export function generateMobileToken(): string {
  const bytes = randomBytes(32);
  return `mol_${bytes.toString("base64url")}`;
}

const MOBILE_SESSION_DURATION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

/**
 * Create a new mobile session for a user.
 * Returns the raw token and expiry date.
 */
export async function createMobileSession(
  userId: string,
): Promise<{ sessionToken: string; expires: Date }> {
  const sessionToken = generateMobileToken();
  const expires = new Date(Date.now() + MOBILE_SESSION_DURATION_MS);

  await prisma.session.create({
    data: { sessionToken, userId, expires },
  });

  return { sessionToken, expires };
}

/**
 * Resolve the current user session from either:
 * 1. A `mol_` bearer token (mobile app)
 * 2. A NextAuth cookie session (web app)
 *
 * Returns the same Session shape as NextAuth's `auth()`.
 */
export async function resolveSession(): Promise<Session | null> {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (authHeader?.startsWith("Bearer mol_")) {
    const token = authHeader.slice(7);
    const dbSession = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: { user: true },
    });

    if (!dbSession || dbSession.expires <= new Date()) {
      return null;
    }

    const user = dbSession.user;
    return {
      user: {
        id: user.id,
        username: user.username,
        role: (user.role as "USER" | "ADMIN") ?? "USER",
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        image: user.avatarUrl ?? user.image,
      },
      expires: dbSession.expires.toISOString(),
    } as Session;
  }

  // Fall through to cookie-based NextAuth
  return auth();
}
