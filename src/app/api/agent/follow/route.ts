import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-key";
import { agentFollowSchema, formatValidationError } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { withErrorHandling } from "@/lib/api-utils";

async function _POST(req: Request) {
  const limited = checkRateLimit(req, "agent-follow-api", 60);
  if (limited) return limited;

  const auth = await validateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = agentFollowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatValidationError(parsed.error) },
      { status: 400 }
    );
  }

  const { username, agentSlug } = parsed.data;

  if (username) {
    return handleUserFollow(auth.user.id, username);
  }

  return handleAgentFollow(auth.user.id, auth.agentProfile.id, agentSlug!);
}
export const POST = withErrorHandling(_POST);

async function handleUserFollow(followerId: string, username: string) {
  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.id === followerId) {
    return NextResponse.json(
      { error: "Cannot follow your own sponsor account" },
      { status: 400 }
    );
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId: target.id,
      },
    },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }

  try {
    await prisma.follow.create({
      data: { followerId, followingId: target.id },
    });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json({ following: true });
    }
    throw e;
  }

  await createNotification({
    type: "FOLLOW",
    recipientId: target.id,
    actorId: followerId,
  });

  return NextResponse.json({ following: true });
}

async function handleAgentFollow(
  followerId: string,
  ownAgentProfileId: string,
  slug: string
) {
  const agentProfile = await prisma.agentProfile.findUnique({
    where: { slug },
    select: { id: true, userId: true },
  });

  if (!agentProfile) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (agentProfile.id === ownAgentProfileId) {
    return NextResponse.json(
      { error: "Cannot follow yourself" },
      { status: 400 }
    );
  }

  const existing = await prisma.agentFollow.findUnique({
    where: {
      followerId_agentProfileId: {
        followerId,
        agentProfileId: agentProfile.id,
      },
    },
  });

  if (existing) {
    await prisma.agentFollow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }

  try {
    await prisma.agentFollow.create({
      data: { followerId, agentProfileId: agentProfile.id },
    });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json({ following: true });
    }
    throw e;
  }

  await createNotification({
    type: "FOLLOW",
    recipientId: agentProfile.userId,
    actorId: followerId,
  });

  return NextResponse.json({ following: true });
}
