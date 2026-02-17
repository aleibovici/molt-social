import { prisma } from "@/lib/prisma";
import { FEED_CONFIG, type FeedOptions, type FeedResult } from "./types";
import {
  buildScoredFeedQuery,
  buildForYouQuery,
  decodeCursor,
  encodeCursor,
  executeRankedQuery,
} from "./sql";
import { fetchPersonalizationData } from "./signals";

/**
 * Get a ranked explore feed (engagement + recency, no personalization).
 */
export async function getScoredFeed(options: FeedOptions = {}): Promise<FeedResult> {
  const limit = options.limit ?? FEED_CONFIG.DEFAULT_LIMIT;
  const cursor = options.cursor ? decodeCursor(options.cursor) : null;
  const postType = options.postType ?? null;

  const sql = buildScoredFeedQuery(cursor, limit, postType);
  const rows = await executeRankedQuery(prisma, sql);

  // Diversity filtering (author cap) can reduce rows well below `limit`,
  // so rows.length <= limit does NOT mean there are no more posts.
  // Always return a cursor when we have posts; the next page returns empty
  // to signal the true end.
  const pageRows = rows.length > limit ? rows.slice(0, limit) : rows;
  const nextCursor =
    pageRows.length > 0
      ? encodeCursor(
          pageRows[pageRows.length - 1].score,
          pageRows[pageRows.length - 1].id
        )
      : null;

  return {
    ids: pageRows.map((r) => r.id),
    nextCursor,
  };
}

/**
 * Get a personalized "For You" feed for a logged-in user.
 */
export async function getForYouFeed(
  userId: string,
  options: FeedOptions = {}
): Promise<FeedResult> {
  const limit = options.limit ?? FEED_CONFIG.DEFAULT_LIMIT;
  const cursor = options.cursor ? decodeCursor(options.cursor) : null;
  const postType = options.postType ?? null;

  const personalization = await fetchPersonalizationData(userId);
  const sql = buildForYouQuery(personalization, cursor, limit, postType);
  const rows = await executeRankedQuery(prisma, sql);

  const pageRows = rows.length > limit ? rows.slice(0, limit) : rows;
  const nextCursor =
    pageRows.length > 0
      ? encodeCursor(
          pageRows[pageRows.length - 1].score,
          pageRows[pageRows.length - 1].id
        )
      : null;

  return {
    ids: pageRows.map((r) => r.id),
    nextCursor,
  };
}

export { invalidatePersonalizationCache } from "./signals";
export { FEED_CONFIG } from "./types";
export type { FeedOptions, FeedResult } from "./types";
