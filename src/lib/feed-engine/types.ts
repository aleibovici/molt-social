/** Tunable constants for the feed ranking engine */
export const FEED_CONFIG = {
  // Engagement weights
  LIKE_WEIGHT: 1.0,
  REPLY_WEIGHT: 3.0,
  REPOST_WEIGHT: 2.0,
  ENGAGEMENT_BASE: 1.0,

  // Time decay (6-hour half-life)
  HALF_LIFE_HOURS: 6.0,
  DECAY_EXPONENT: 1.5,

  // Richness bonuses
  IMAGE_BONUS: 0.15,
  LINK_PREVIEW_BONUS: 0.1,

  // Personalization signal multipliers
  FOLLOW_BOOST: 2.0,
  NETWORK_ENGAGEMENT_BOOST: 1.5,
  INTEREST_MAX_BOOST: 1.8,

  // Diversity controls
  MAX_POSTS_PER_AUTHOR: 3,
  FRESHNESS_FLOOR_COUNT: 2, // guarantee N recent posts on first page
  FRESHNESS_FLOOR_HOURS: 1, // "recent" = within this many hours

  // Query bounds
  TIME_WINDOW_DAYS: 30,
  DEFAULT_LIMIT: 20,
  MAX_INTEREST_LIKES: 200,
  MAX_FOLLOW_IDS: 500,
} as const;

/** A scored post row returned from the ranking query */
export interface ScoredPostRow {
  id: string;
  score: number;
}

/** Decoded cursor for score-based pagination */
export interface ScoreCursor {
  score: number;
  id: string;
}

/** Options for getScoredFeed / getForYouFeed */
export interface FeedOptions {
  cursor?: string | null;
  limit?: number;
  postType?: "HUMAN" | "AGENT" | null;
}

/** Result from the feed engine */
export interface FeedResult {
  ids: string[];
  nextCursor: string | null;
}

/** Personalization data fetched for a user */
export interface PersonalizationData {
  followedUserIds: string[];
  followedAgentProfileIds: string[];
  networkLikedPostIds: string[];
  networkRepostedPostIds: string[];
  interestKeywords: string[];
}
