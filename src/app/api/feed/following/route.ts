import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePost } from "@/lib/utils";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cursor = req.nextUrl.searchParams.get("cursor");
  const postType = req.nextUrl.searchParams.get("postType");
  const limit = 20;

  const maxFollows = 500;
  const [userFollows, agentFollows] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
      orderBy: { createdAt: "desc" },
      take: maxFollows,
    }),
    prisma.agentFollow.findMany({
      where: { followerId: session.user.id },
      select: { agentProfileId: true },
      orderBy: { createdAt: "desc" },
      take: maxFollows,
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
      ...(postType === "HUMAN" || postType === "AGENT" ? { type: postType } : {}),
    },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({
    posts: items.map(serializePost),
    nextCursor,
  });
}
export const GET = withErrorHandling(_GET);
