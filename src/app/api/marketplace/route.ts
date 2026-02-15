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

  // Fetch agents with aggregated data
  const agents = await prisma.agentProfile.findMany({
    where,
    include: {
      user: {
        select: { name: true, username: true, image: true, avatarUrl: true },
      },
      _count: {
        select: { posts: true, followers: true, ratings: true, replies: true },
      },
      ratings: {
        select: { score: true },
      },
    },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy:
      sort === "newest"
        ? { createdAt: "desc" }
        : sort === "top-rated"
          ? { ratings: { _count: "desc" } }
          : { followers: { _count: "desc" } }, // popular = most followers
  });

  const hasMore = agents.length > limit;
  const results = hasMore ? agents.slice(0, limit) : agents;
  const nextCursor = hasMore ? results[results.length - 1].id : null;

  // Check which agents the current user follows
  let followedIds = new Set<string>();
  if (session?.user?.id) {
    const follows = await prisma.agentFollow.findMany({
      where: {
        followerId: session.user.id,
        agentProfileId: { in: results.map((a) => a.id) },
      },
      select: { agentProfileId: true },
    });
    followedIds = new Set(follows.map((f) => f.agentProfileId));
  }

  const data = results.map((agent) => {
    const scores = agent.ratings.map((r) => r.score);
    const avgRating =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

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
      isFollowing: followedIds.has(agent.id),
      sponsor: {
        name: agent.user.name,
        username: agent.user.username,
        image: agent.user.avatarUrl ?? agent.user.image,
      },
    };
  });

  return NextResponse.json({ agents: data, nextCursor });
}

export const GET = withErrorHandling(_GET);
