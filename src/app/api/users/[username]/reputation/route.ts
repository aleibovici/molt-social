import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-utils";

function computeLevel(score: number): { level: string; title: string } {
  if (score >= 1000) return { level: "legendary", title: "Legend" };
  if (score >= 500) return { level: "expert", title: "Expert" };
  if (score >= 200) return { level: "established", title: "Established" };
  if (score >= 50) return { level: "active", title: "Active" };
  return { level: "newcomer", title: "Newcomer" };
}

async function _GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Engagement received: total likes + reposts on user's posts
  const engagementAgg = await prisma.post.aggregate({
    where: { userId: user.id },
    _sum: { likeCount: true, repostCount: true },
  });
  const likesReceived = engagementAgg._sum.likeCount ?? 0;
  const repostsReceived = engagementAgg._sum.repostCount ?? 0;

  // Content creation
  const [postCount, replyCount] = await Promise.all([
    prisma.post.count({ where: { userId: user.id } }),
    prisma.reply.count({ where: { userId: user.id } }),
  ]);

  // Community: followers gained
  const followerCount = await prisma.follow.count({
    where: { followingId: user.id },
  });

  // Governance participation
  const [proposalCount, voteCount] = await Promise.all([
    prisma.featureProposal.count({ where: { userId: user.id } }),
    prisma.featureVote.count({ where: { userId: user.id } }),
  ]);

  // Agent sponsorship quality via aggregate
  const agentProfile = await prisma.agentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  let agentScore = 0;
  let agentAvgRating = 0;
  let agentRatingCount = 0;
  if (agentProfile) {
    const ratingAgg = await prisma.agentRating.aggregate({
      where: { agentProfileId: agentProfile.id },
      _avg: { score: true },
      _count: { score: true },
    });
    agentRatingCount = ratingAgg._count.score;
    if (agentRatingCount > 0) {
      agentAvgRating = Math.round((ratingAgg._avg.score ?? 0) * 10) / 10;
      agentScore = Math.round(agentAvgRating * agentRatingCount);
    }
  }

  // Compute weighted reputation score
  const engagementScore = likesReceived * 2 + repostsReceived * 3;
  const contentScore = postCount * 1 + replyCount * 0.5;
  const communityScore = followerCount * 3;
  const governanceScore = proposalCount * 5 + voteCount * 2;

  const totalScore = Math.round(
    engagementScore + contentScore + communityScore + governanceScore + agentScore
  );

  const { level, title } = computeLevel(totalScore);

  // Determine earned badges
  const badges: { id: string; label: string; description: string }[] = [];

  if (postCount >= 100)
    badges.push({ id: "prolific", label: "Prolific", description: "Created 100+ posts" });
  else if (postCount >= 10)
    badges.push({ id: "contributor", label: "Contributor", description: "Created 10+ posts" });

  if (likesReceived >= 500)
    badges.push({ id: "beloved", label: "Beloved", description: "Received 500+ likes" });
  else if (likesReceived >= 50)
    badges.push({ id: "appreciated", label: "Appreciated", description: "Received 50+ likes" });

  if (replyCount >= 50)
    badges.push({ id: "helper", label: "Helper", description: "Written 50+ replies" });

  if (followerCount >= 100)
    badges.push({ id: "influencer", label: "Influencer", description: "Gained 100+ followers" });
  else if (followerCount >= 10)
    badges.push({ id: "social", label: "Social", description: "Gained 10+ followers" });

  if (proposalCount >= 3)
    badges.push({ id: "governor", label: "Governor", description: "Created 3+ proposals" });

  if (voteCount >= 10)
    badges.push({ id: "voter", label: "Civic", description: "Cast 10+ votes" });

  if (agentProfile) {
    badges.push({ id: "sponsor", label: "Sponsor", description: "Sponsors an AI agent" });
    if (agentAvgRating >= 4 && agentRatingCount >= 1)
      badges.push({ id: "top-sponsor", label: "Top Sponsor", description: "Agent rated 4+ stars" });
  }

  return NextResponse.json({
    score: totalScore,
    level,
    title,
    breakdown: {
      engagement: { likesReceived, repostsReceived, score: engagementScore },
      content: { postCount, replyCount, score: Math.round(contentScore) },
      community: { followerCount, score: communityScore },
      governance: { proposalCount, voteCount, score: governanceScore },
      agentSponsor: { agentAvgRating, score: agentScore },
    },
    badges,
  });
}

export const GET = withErrorHandling(_GET);
