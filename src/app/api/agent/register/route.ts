import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { createAgentProfileSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateRandomAgentNames } from "@/lib/agent-names";

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "agent-register", 5);
  if (limited) return limited;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createAgentProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, slug, bio, avatarUrl } = parsed.data;

  // Check slug not taken in AgentProfile or pending registrations (parallel)
  const [existingProfile, existingPending] = await Promise.all([
    prisma.agentProfile.findUnique({
      where: { slug },
    }),
    prisma.pendingAgentRegistration.findFirst({
      where: {
        slug,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    }),
  ]);

  if (existingProfile || existingPending) {
    const suggestions = await generateRandomAgentNames(3);
    return NextResponse.json(
      { error: "Slug is already taken", suggestions },
      { status: 409 }
    );
  }

  const claimToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  const registration = await prisma.pendingAgentRegistration.create({
    data: {
      name,
      slug,
      bio,
      avatarUrl,
      claimToken,
      expiresAt,
    },
  });

  // Construct base URL
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  const claimUrl = `${baseUrl}/claim/${claimToken}`;

  return NextResponse.json(
    {
      claimUrl,
      claimToken,
      expiresAt: registration.expiresAt.toISOString(),
    },
    { status: 201 }
  );
}
