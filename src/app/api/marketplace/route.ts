import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-utils";
import { AgentCategory } from "@/generated/prisma/client";

async function _GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") as AgentCategory | null;
  const sort = url.searchParams.get("sort") || "popular"; // popular | newest | top-rated
  const search = url.searchParams.get("q") || "";
  const cursor = url.searchParams.get("cursor");
  const limit = 20;

  const session = await resolveSession();

  const where: Record<string, unknown> = {};

  if (category && Object.values(AgentCategory).includes(category)) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { bio: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  // For top-rated, we need to sort in application code since Prisma
  // can't order by a relation's aggregate field (avg score).
  // Fetch a larger batch, compute avg, sort, then paginate.
  const isTopRated = sort === "top-rated";

  const agents = await prisma.agentProfile.findMany({
    where,
    include: {
      user: {
        select: { name: true, username: true, image: true, avatarUrl: true },
      },
      _count: {
        select: { posts: true, followers: true, ratings: true, replies: true },
      },
    },
    // For top-rated, fetch all matching agents so we can sort by avg rating.
    // For other sorts, use cursor pagination normally.
    ...(isTopRated
      ? {}
      : {
          take: limit + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          orderBy:
            sort === "newest"
              ? { createdAt: "desc" as const }
              : { followers: { _count: "desc" as const } },
        }),
  });

  // Batch-fetch avg ratings using groupBy instead of loading all individual ratings
  const agentIds = agents.map((a) => a.id);
  const ratingAggs = await prisma.agentRating.groupBy({
    by: ["agentProfileId"],
    where: { agentProfileId: { in: agentIds } },
    _avg: { score: true },
  });
  const avgRatingMap = new Map(
    ratingAggs.map((r) => [r.agentProfileId, r._avg.score ?? 0])
  );

  // Build mapped results with avg rating
  let mapped = agents.map((agent) => {
    const avgRating = avgRatingMap.get(agent.id) ?? 0;
    return {
      id: agent.id,
      name: agent.name,
      slug: agent.slug,
      bio: agent.bio,
      avatarUrl: agent.avatarUrl,
      category: agent.category,
      websiteUrl: agent.websiteUrl,
      createdAt: agent.createdAt,
      postCount: agent._count.posts,
      replyCount: agent._count.replies,
      followerCount: agent._count.followers,
      ratingCount: agent._count.ratings,
      avgRating: Math.round(avgRating * 10) / 10,
      sponsor: {
        name: agent.user.name,
        username: agent.user.username,
        image: agent.user.avatarUrl ?? agent.user.image,
      },
    };
  });

  // For top-rated: sort by avg rating desc (weighted by having at least 1 rating),
  // then apply cursor-based pagination manually.
  let nextCursor: string | null = null;
  if (isTopRated) {
    mapped.sort((a, b) => {
      // Agents with ratings come first, sorted by avg rating desc
      if (a.ratingCount === 0 && b.ratingCount > 0) return 1;
      if (b.ratingCount === 0 && a.ratingCount > 0) return -1;
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      // Tie-break by rating count desc
      return b.ratingCount - a.ratingCount;
    });

    // Apply cursor: skip past the cursor ID
    if (cursor) {
      const cursorIdx = mapped.findIndex((a) => a.id === cursor);
      if (cursorIdx >= 0) {
        mapped = mapped.slice(cursorIdx + 1);
      }
    }

    const hasMore = mapped.length > limit;
    mapped = mapped.slice(0, limit);
    nextCursor = hasMore ? mapped[mapped.length - 1].id : null;
  } else {
    const hasMore = mapped.length > limit;
    mapped = hasMore ? mapped.slice(0, limit) : mapped;
    nextCursor = hasMore ? mapped[mapped.length - 1].id : null;
  }

  // Check which agents the current user follows
  let followedIds = new Set<string>();
  if (session?.user?.id) {
    const follows = await prisma.agentFollow.findMany({
      where: {
        followerId: session.user.id,
        agentProfileId: { in: mapped.map((a) => a.id) },
      },
      select: { agentProfileId: true },
    });
    followedIds = new Set(follows.map((f) => f.agentProfileId));
  }

  const data = mapped.map((agent) => ({
    ...agent,
    isFollowing: followedIds.has(agent.id),
  }));

  return NextResponse.json({ agents: data, nextCursor });
}

export const GET = withErrorHandling(_GET);
