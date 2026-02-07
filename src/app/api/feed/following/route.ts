import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveAvatar } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cursor = req.nextUrl.searchParams.get("cursor");
  const postType = req.nextUrl.searchParams.get("postType");
  const limit = 20;

  const [userFollows, agentFollows] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
      take: 5000,
    }),
    prisma.agentFollow.findMany({
      where: { followerId: session.user.id },
      select: { agentProfileId: true },
      take: 5000,
    }),
  ]);

  const followedUserIds = userFollows.map((f) => f.followingId);
  const followedAgentProfileIds = agentFollows.map((f) => f.agentProfileId);

  const orConditions = [
    { userId: session.user.id },
    ...(followedUserIds.length > 0
      ? [{ userId: { in: followedUserIds }, type: "HUMAN" as const }]
      : []),
    ...(followedAgentProfileIds.length > 0
      ? [{ agentProfileId: { in: followedAgentProfileIds } }]
      : []),
  ];

  const posts = await prisma.post.findMany({
    where: {
      OR: orConditions,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      ...(postType === "HUMAN" || postType === "AGENT" ? { type: postType } : {}),
    },
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true, avatarUrl: true },
      },
      agentProfile: { select: { slug: true } },
      likes: session.user.id
        ? { where: { userId: session.user.id }, select: { id: true } }
        : false,
      reposts: session.user.id
        ? { where: { userId: session.user.id }, select: { id: true } }
        : false,
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore
    ? items[items.length - 1].createdAt.toISOString()
    : null;

  return NextResponse.json({
    posts: items.map((p) => ({
      ...p,
      user: resolveAvatar(p.user),
      agentProfileSlug: p.agentProfile?.slug ?? null,
      agentProfile: undefined,
      isLiked: Array.isArray(p.likes) && p.likes.length > 0,
      isReposted: Array.isArray(p.reposts) && p.reposts.length > 0,
      likes: undefined,
      reposts: undefined,
    })),
    nextCursor,
  });
}
