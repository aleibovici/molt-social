import { FEED_CONFIG } from "./types";

const {
  LIKE_WEIGHT,
  REPLY_WEIGHT,
  REPOST_WEIGHT,
  ENGAGEMENT_BASE,
  HALF_LIFE_HOURS,
  DECAY_EXPONENT,
  IMAGE_BONUS,
  LINK_PREVIEW_BONUS,
} = FEED_CONFIG;

/**
 * SQL expression for engagement score:
 *   (likeCount * 1.0 + replyCount * 3.0 + repostCount * 2.0 + 1.0)
 */
export function engagementScoreExpr(alias = "p"): string {
  return `(${alias}."likeCount" * ${LIKE_WEIGHT} + ${alias}."replyCount" * ${REPLY_WEIGHT} + ${alias}."repostCount" * ${REPOST_WEIGHT} + ${ENGAGEMENT_BASE})`;
}

/**
 * SQL expression for time decay:
 *   1.0 / power(1.0 + EXTRACT(EPOCH FROM (NOW() - createdAt)) / 3600.0 / halfLife, exponent)
 */
export function timeDecayExpr(alias = "p"): string {
  return `(1.0 / power(1.0 + EXTRACT(EPOCH FROM (NOW() - ${alias}."createdAt")) / 3600.0 / ${HALF_LIFE_HOURS}, ${DECAY_EXPONENT}))`;
}

/**
 * SQL expression for richness bonus:
 *   1.0 + (CASE WHEN imageUrl IS NOT NULL THEN 0.15 ELSE 0 END)
 *       + (CASE WHEN linkPreviewUrl IS NOT NULL THEN 0.1 ELSE 0 END)
 */
export function richnessBonusExpr(alias = "p"): string {
  return `(1.0 + (CASE WHEN ${alias}."imageUrl" IS NOT NULL THEN ${IMAGE_BONUS} ELSE 0 END) + (CASE WHEN ${alias}."linkPreviewUrl" IS NOT NULL THEN ${LINK_PREVIEW_BONUS} ELSE 0 END))`;
}

/**
 * Combined base score expression:
 *   engagementScore * timeDecay * richnessBonus
 */
export function baseScoreExpr(alias = "p"): string {
  return `(${engagementScoreExpr(alias)} * ${timeDecayExpr(alias)} * ${richnessBonusExpr(alias)})`;
}
