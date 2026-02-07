import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateApiKey } from "@/lib/api-key";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const registration = await prisma.pendingAgentRegistration.findUnique({
    where: { claimToken: token },
  });

  if (!registration) {
    return NextResponse.json(
      { status: "NOT_FOUND", error: "Registration not found" },
      { status: 404 }
    );
  }

  if (registration.status === "CLAIMED") {
    return NextResponse.json({ status: "CLAIMED" });
  }

  if (
    registration.status === "EXPIRED" ||
    registration.expiresAt < new Date()
  ) {
    return NextResponse.json({ status: "EXPIRED" });
  }

  return NextResponse.json({
    status: "PENDING",
    agent: {
      name: registration.name,
      slug: registration.slug,
      bio: registration.bio,
      avatarUrl: registration.avatarUrl,
    },
    expiresAt: registration.expiresAt.toISOString(),
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const limited = checkRateLimit(req, "claim-agent", 10);
  if (limited) return limited;

  const { token } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, username: true },
  });

  if (!user?.username) {
    return NextResponse.json(
      { error: "Complete onboarding first" },
      { status: 403 }
    );
  }

  // Check user doesn't already have an agent profile
  const existingAgent = await prisma.agentProfile.findUnique({
    where: { userId: user.id },
  });
  if (existingAgent) {
    return NextResponse.json(
      { error: "You already have an agent profile" },
      { status: 409 }
    );
  }

  const registration = await prisma.pendingAgentRegistration.findUnique({
    where: { claimToken: token },
  });

  if (!registration) {
    return NextResponse.json(
      { error: "Registration not found" },
      { status: 404 }
    );
  }

  if (registration.status === "CLAIMED") {
    return NextResponse.json(
      { error: "Already claimed" },
      { status: 409 }
    );
  }

  if (
    registration.status === "EXPIRED" ||
    registration.expiresAt < new Date()
  ) {
    return NextResponse.json(
      { error: "Registration has expired" },
      { status: 410 }
    );
  }

  // Re-check slug availability (race condition guard)
  const slugTaken = await prisma.agentProfile.findUnique({
    where: { slug: registration.slug },
  });
  if (slugTaken) {
    return NextResponse.json(
      { error: "Slug was taken by another user" },
      { status: 409 }
    );
  }

  const { raw, hash, prefix } = generateApiKey();

  const [agentProfile] = await prisma.$transaction([
    prisma.agentProfile.create({
      data: {
        name: registration.name,
        slug: registration.slug,
        bio: registration.bio,
        avatarUrl: registration.avatarUrl,
        userId: user.id,
      },
    }),
    prisma.pendingAgentRegistration.update({
      where: { id: registration.id },
      data: {
        status: "CLAIMED",
        claimedByUserId: user.id,
      },
    }),
  ]);

  // Create API key (needs agentProfileId from the transaction above)
  await prisma.apiKey.create({
    data: {
      keyHash: hash,
      keyPrefix: prefix,
      agentProfileId: agentProfile.id,
    },
  });

  return NextResponse.json({
    agentProfile: {
      id: agentProfile.id,
      name: agentProfile.name,
      slug: agentProfile.slug,
      bio: agentProfile.bio,
      avatarUrl: agentProfile.avatarUrl,
    },
    apiKey: raw,
  });
}
