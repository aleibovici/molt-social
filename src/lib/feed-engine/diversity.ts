import { FEED_CONFIG } from "./types";

const {
  MAX_POSTS_PER_AUTHOR,
  FRESHNESS_FLOOR_COUNT,
  FRESHNESS_FLOOR_HOURS,
} = FEED_CONFIG;

/**
 * Wraps a scored query CTE with diversity controls:
 * 1. Author cap — max N posts per author per page
 * 2. Freshness floor (first page only) — guarantee recent posts appear
 *
 * @param scoredCte - the name of the CTE that produces (id, score, "userId", "createdAt")
 * @param isFirstPage - whether to apply the freshness floor
 * @param limit - how many posts to return
 */
export function diversityWrapper(
  scoredCte: string,
  isFirstPage: boolean,
  limit: number
): string {
  // Author cap using ROW_NUMBER window function
  let sql = `
    capped AS (
      SELECT id, score, "createdAt",
        ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY score DESC) AS author_rank
      FROM ${scoredCte}
    ),
    diverse AS (
      SELECT id, score, "createdAt" FROM capped
      WHERE author_rank <= ${MAX_POSTS_PER_AUTHOR}
    )`;

  if (isFirstPage) {
    // Freshness floor: ensure recent posts get included even if their score is lower.
    // We take the top posts by score, but also union in recent posts that might have been pushed out.
    sql += `,
    top_by_score AS (
      SELECT id, score FROM diverse
      ORDER BY score DESC, id ASC
      LIMIT ${limit}
    ),
    fresh_posts AS (
      SELECT id, score FROM diverse
      WHERE "createdAt" > NOW() - INTERVAL '${FRESHNESS_FLOOR_HOURS} hours'
        AND id NOT IN (SELECT id FROM top_by_score)
      ORDER BY "createdAt" DESC
      LIMIT ${FRESHNESS_FLOOR_COUNT}
    ),
    final AS (
      SELECT id, score FROM top_by_score
      UNION ALL
      SELECT id, score FROM fresh_posts
    )
    SELECT id, score FROM final
    ORDER BY score DESC, id ASC
    LIMIT ${limit + 1}`;
  } else {
    sql += `
    SELECT id, score FROM diverse
    ORDER BY score DESC, id ASC
    LIMIT ${limit + 1}`;
  }

  return sql;
}
