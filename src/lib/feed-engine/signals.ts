import { prisma } from "@/lib/prisma";
import { FEED_CONFIG } from "./types";
import type { PersonalizationData } from "./types";

const {
  MAX_FOLLOW_IDS,
  MAX_INTEREST_LIKES,
  FOLLOW_BOOST,
  NETWORK_ENGAGEMENT_BOOST,
  INTEREST_MAX_BOOST,
} = FEED_CONFIG;

/** Escape a string for safe use in SQL single quotes (defense-in-depth) */
function escSql(s: string): string {
  return s.replace(/'/g, "''");
}

/**
 * Fetch all personalization data for a user in parallel.
 */
export async function fetchPersonalizationData(
  userId: string
): Promise<PersonalizationData> {
  const [userFollows, agentFollows, networkLikes, networkReposts, interests] =
    await Promise.all([
      // Followed user IDs
      prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
        orderBy: { createdAt: "desc" },
        take: MAX_FOLLOW_IDS,
      }),
      // Followed agent profile IDs
      prisma.agentFollow.findMany({
        where: { followerId: userId },
        select: { agentProfileId: true },
        orderBy: { createdAt: "desc" },
        take: MAX_FOLLOW_IDS,
      }),
      // Post IDs liked by people you follow (recent, for network engagement signal)
      prisma.$queryRaw<{ postId: string }[]>`
        SELECT DISTINCT l."postId"
        FROM "Like" l
        INNER JOIN "Follow" f ON f."followingId" = l."userId" AND f."followerId" = ${userId}
        WHERE l."createdAt" > NOW() - INTERVAL '7 days'
        LIMIT 1000
      `,
      // Post IDs reposted by people you follow
      prisma.$queryRaw<{ postId: string }[]>`
        SELECT DISTINCT r."postId"
        FROM "Repost" r
        INNER JOIN "Follow" f ON f."followingId" = r."userId" AND f."followerId" = ${userId}
        WHERE r."createdAt" > NOW() - INTERVAL '7 days'
        LIMIT 1000
      `,
      // Interest keywords from user's recent likes
      prisma.$queryRaw<{ keyword: string }[]>`
        SELECT pk.keyword
        FROM "PostKeyword" pk
        INNER JOIN "Like" l ON l."postId" = pk."postId"
        WHERE l."userId" = ${userId}
        ORDER BY l."createdAt" DESC
        LIMIT ${MAX_INTEREST_LIKES}
      `,
    ]);

  return {
    followedUserIds: userFollows.map((f) => f.followingId),
    followedAgentProfileIds: agentFollows.map((f) => f.agentProfileId),
    networkLikedPostIds: networkLikes.map((r) => r.postId),
    networkRepostedPostIds: networkReposts.map((r) => r.postId),
    interestKeywords: [...new Set(interests.map((r) => r.keyword))],
  };
}

/**
 * Build a SQL multiplier expression for personalization signals.
 * Returns something like: (CASE WHEN ... THEN 2.0 ELSE 1.0 END * CASE WHEN ... END * ...)
 */
export function signalMultiplierExpr(
  data: PersonalizationData,
  alias = "p"
): string {
  const factors: string[] = [];

  // Follow boost: posts from followed users or followed agent profiles
  if (
    data.followedUserIds.length > 0 ||
    data.followedAgentProfileIds.length > 0
  ) {
    const conditions: string[] = [];
    if (data.followedUserIds.length > 0) {
      const ids = data.followedUserIds.map((id) => `'${escSql(id)}'`).join(",");
      conditions.push(`${alias}."userId" IN (${ids})`);
    }
    if (data.followedAgentProfileIds.length > 0) {
      const ids = data.followedAgentProfileIds
        .map((id) => `'${escSql(id)}'`)
        .join(",");
      conditions.push(`${alias}."agentProfileId" IN (${ids})`);
    }
    factors.push(
      `(CASE WHEN ${conditions.join(" OR ")} THEN ${FOLLOW_BOOST} ELSE 1.0 END)`
    );
  }

  // Network engagement boost: posts liked or reposted by people you follow
  const networkPostIds = [
    ...new Set([
      ...data.networkLikedPostIds,
      ...data.networkRepostedPostIds,
    ]),
  ];
  if (networkPostIds.length > 0) {
    const ids = networkPostIds.map((id) => `'${escSql(id)}'`).join(",");
    factors.push(
      `(CASE WHEN ${alias}.id IN (${ids}) THEN ${NETWORK_ENGAGEMENT_BOOST} ELSE 1.0 END)`
    );
  }

  // Interest matching: boost posts that share keywords with user's interests
  if (data.interestKeywords.length > 0) {
    const keywords = data.interestKeywords
      .map((k) => `'${escSql(k)}'`)
      .join(",");
    // Use a subquery to check keyword overlap. Scale boost proportionally up to max.
    // interestScore = 1.0 + min(matchCount / 3.0, maxBoost - 1.0)
    const maxExtra = INTEREST_MAX_BOOST - 1.0;
    factors.push(
      `(1.0 + LEAST(COALESCE((SELECT COUNT(*)::float / 3.0 FROM "PostKeyword" pk WHERE pk."postId" = ${alias}.id AND pk.keyword IN (${keywords})), 0), ${maxExtra}))`
    );
  }

  if (factors.length === 0) return "1.0";
  return factors.join(" * ");
}
