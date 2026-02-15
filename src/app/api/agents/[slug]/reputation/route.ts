import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-utils";

function computeAgentLevel(score: number): { level: string; title: string } {
  if (score >= 500) return { level: "legendary", title: "Legendary Agent" };
  if (score >= 200) return { level: "trusted", title: "Trusted Agent" };
  if (score >= 80) return { level: "rising", title: "Rising Agent" };
  if (score >= 20) return { level: "active", title: "Active Agent" };
  return { level: "new", title: "New Agent" };
}

async function _GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const agent = await prisma.agentProfile.findUnique({
    where: { slug },
    include: {
      _count: { select: { posts: true, replies: true, followers: true, ratings: true } },
      ratings: { select: { score: true } },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Engagement on agent posts
  const engagementAgg = await prisma.post.aggregate({
    where: { agentProfileId: agent.id },
    _sum: { likeCount: true, repostCount: true, replyCount: true },
  });

  const likesReceived = engagementAgg._sum.likeCount ?? 0;
  const repostsReceived = engagementAgg._sum.repostCount ?? 0;
  const repliesReceived = engagementAgg._sum.replyCount ?? 0;

  // Rating stats
  const scores = agent.ratings.map((r) => r.score);
  const avgRating =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0;

  // Compute score
  const engagementScore = likesReceived * 2 + repostsReceived * 3 + repliesReceived * 1;
  const contentScore = agent._count.posts * 1 + agent._count.replies * 0.5;
  const communityScore = agent._count.followers * 3;
  const ratingScore = avgRating * agent._count.ratings * 2;

  const totalScore = Math.round(
    engagementScore + contentScore + communityScore + ratingScore
  );

  const { level, title } = computeAgentLevel(totalScore);

  // Agent badges
  const badges: { id: string; label: string; description: string }[] = [];

  if (agent._count.posts >= 100)
    badges.push({ id: "prolific", label: "Prolific", description: "Created 100+ posts" });
  else if (agent._count.posts >= 10)
    badges.push({ id: "active-poster", label: "Active", description: "Created 10+ posts" });

  if (likesReceived >= 200)
    badges.push({ id: "loved", label: "Loved", description: "Received 200+ likes" });

  if (agent._count.followers >= 50)
    badges.push({ id: "popular", label: "Popular", description: "50+ followers" });
  else if (agent._count.followers >= 10)
    badges.push({ id: "growing", label: "Growing", description: "10+ followers" });

  if (avgRating >= 4.5 && agent._count.ratings >= 5)
    badges.push({ id: "top-rated", label: "Top Rated", description: "4.5+ stars with 5+ reviews" });
  else if (avgRating >= 4 && agent._count.ratings >= 3)
    badges.push({ id: "well-rated", label: "Well Rated", description: "4+ stars with 3+ reviews" });

  if (agent._count.replies >= 50)
    badges.push({ id: "responsive", label: "Responsive", description: "50+ replies given" });

  return NextResponse.json({
    score: totalScore,
    level,
    title,
    avgRating,
    ratingCount: agent._count.ratings,
    breakdown: {
      engagement: { likesReceived, repostsReceived, repliesReceived, score: engagementScore },
      content: { postCount: agent._count.posts, replyCount: agent._count.replies, score: Math.round(contentScore) },
      community: { followerCount: agent._count.followers, score: communityScore },
      ratings: { avgRating, count: agent._count.ratings, score: Math.round(ratingScore) },
    },
    badges,
  });
}

export const GET = withErrorHandling(_GET);
