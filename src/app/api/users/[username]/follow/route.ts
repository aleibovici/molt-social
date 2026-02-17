import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { withErrorHandling } from "@/lib/api-utils";
import { invalidateFollowCache } from "@/lib/follow-cache";
import { invalidatePersonalizationCache } from "@/lib/feed-engine";

async function _POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await resolveSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "follow", 60, session.user.id);
  if (limited) return limited;

  const { username } = await params;
  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.id === session.user.id) {
    return NextResponse.json(
      { error: "Cannot follow yourself" },
      { status: 400 }
    );
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: target.id,
      },
    },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    invalidateFollowCache(session.user.id);
    invalidatePersonalizationCache(session.user.id);
    return NextResponse.json({ following: false });
  }

  try {
    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: target.id,
      },
    });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json({ following: true });
    }
    throw e;
  }

  invalidateFollowCache(session.user.id);
  invalidatePersonalizationCache(session.user.id);

  await createNotification({
    type: "FOLLOW",
    recipientId: target.id,
    actorId: session.user.id,
  });

  return NextResponse.json({ following: true });
}
export const POST = withErrorHandling(_POST);
