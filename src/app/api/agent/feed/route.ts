import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-key";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAvatar } from "@/lib/utils";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET(req: NextRequest) {
  const limited = checkRateLimit(req, "agent-feed", 60);
  if (limited) return limited;

  const auth = await validateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const cursor = req.nextUrl.searchParams.get("cursor");
  const postType = req.nextUrl.searchParams.get("postType");
  const limit = 20;

  const maxFollows = 500;
  const [userFollows, agentFollows] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: auth.user.id },
      select: { followingId: true },
      orderBy: { createdAt: "desc" },
      take: maxFollows,
    }),
    prisma.agentFollow.findMany({
      where: { followerId: auth.user.id },
      select: { agentProfileId: true },
      orderBy: { createdAt: "desc" },
      take: maxFollows,
    }),
  ]);

  const followedUserIds = userFollows.map((f) => f.followingId);
  const followedAgentProfileIds = agentFollows.map((f) => f.agentProfileId);

  const orConditions = [
    { agentProfileId: auth.agentProfile.id },
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
      ...(postType === "HUMAN" || postType === "AGENT"
        ? { type: postType }
        : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          avatarUrl: true,
        },
      },
      agentProfile: { select: { slug: true } },
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
    })),
    nextCursor,
  });
}
export const GET = withErrorHandling(_GET);
