import { FEED_CONFIG, type ScoreCursor, type ScoredPostRow } from "./types";
import { baseScoreExpr } from "./scoring";
import { diversityWrapper } from "./diversity";
import type { PersonalizationData } from "./types";
import { signalMultiplierExpr, buildInterestJoin } from "./signals";

const { TIME_WINDOW_DAYS } = FEED_CONFIG;

/** Encode a score cursor for pagination */
export function encodeCursor(score: number, id: string): string {
  return `${score}:${id}`;
}

/** Decode a score cursor */
export function decodeCursor(cursor: string): ScoreCursor | null {
  const sep = cursor.indexOf(":");
  if (sep === -1) return null;
  const score = parseFloat(cursor.substring(0, sep));
  const id = cursor.substring(sep + 1);
  if (isNaN(score) || !id) return null;
  return { score, id };
}

/**
 * Build the complete SQL for the scored explore feed (no personalization).
 */
export function buildScoredFeedQuery(
  cursor: ScoreCursor | null,
  limit: number,
  postType: "HUMAN" | "AGENT" | null
): string {
  const scoreExpr = baseScoreExpr("p");
  const typeFilter = postType ? `AND p."type" = '${postType}'` : "";

  const cursorFilter = cursor
    ? `AND (
        (${scoreExpr}) < ${cursor.score}
        OR ((${scoreExpr}) = ${cursor.score} AND p.id > '${cursor.id}')
      )`
    : "";

  const isFirstPage = cursor === null;

  const sql = `
    WITH scored AS (
      SELECT p.id, (${scoreExpr}) AS score, p."userId", p."createdAt"
      FROM "Post" p
      WHERE p."createdAt" > NOW() - INTERVAL '${TIME_WINDOW_DAYS} days'
        ${typeFilter}
        ${cursorFilter}
    ),
    ${diversityWrapper("scored", isFirstPage, limit)}
  `;

  return sql;
}

/**
 * Build the complete SQL for the personalized "For You" feed.
 */
export function buildForYouQuery(
  personalization: PersonalizationData,
  cursor: ScoreCursor | null,
  limit: number,
  postType: "HUMAN" | "AGENT" | null
): string {
  const scoreExpr = baseScoreExpr("p");
  const signalExpr = signalMultiplierExpr(personalization, "p");
  const finalScoreExpr = `((${scoreExpr}) * ${signalExpr})`;
  const typeFilter = postType ? `AND p."type" = '${postType}'` : "";
  const { cte: interestCte, join: interestJoin } = buildInterestJoin(personalization, "p");

  const cursorFilter = cursor
    ? `AND (
        ${finalScoreExpr} < ${cursor.score}
        OR (${finalScoreExpr} = ${cursor.score} AND p.id > '${cursor.id}')
      )`
    : "";

  const isFirstPage = cursor === null;

  const withClauses = [
    interestCte,
    `scored AS (
      SELECT p.id, ${finalScoreExpr} AS score, p."userId", p."createdAt"
      FROM "Post" p
      ${interestJoin}
      WHERE p."createdAt" > NOW() - INTERVAL '${TIME_WINDOW_DAYS} days'
        ${typeFilter}
        ${cursorFilter}
    )`,
    diversityWrapper("scored", isFirstPage, limit),
  ].filter(Boolean);

  const sql = `WITH ${withClauses.join(",\n")}`;

  return sql;
}

/**
 * Execute a raw SQL query and return scored post rows.
 */
export async function executeRankedQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaClient: { $queryRawUnsafe: (...args: any[]) => Promise<any> },
  sql: string
): Promise<ScoredPostRow[]> {
  return prismaClient.$queryRawUnsafe(sql) as Promise<ScoredPostRow[]>;
}
