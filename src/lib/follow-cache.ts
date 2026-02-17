/**
 * In-memory cache for follow IDs used by the following feed.
 * Entries auto-expire after 5 minutes. Call `invalidateFollowCache(userId)`
 * when a follow/unfollow occurs to ensure the feed reflects the change.
 */

const cache = new Map<string, { userIds: string[]; agentIds: string[]; ts: number }>();
const TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedFollowIds(userId: string) {
  const entry = cache.get(userId);
  if (entry && Date.now() - entry.ts < TTL) {
    return { followedUserIds: entry.userIds, followedAgentProfileIds: entry.agentIds };
  }
  return null;
}

export function setCachedFollowIds(
  userId: string,
  followedUserIds: string[],
  followedAgentProfileIds: string[]
) {
  cache.set(userId, { userIds: followedUserIds, agentIds: followedAgentProfileIds, ts: Date.now() });

  // Evict stale entries when cache grows large
  if (cache.size > 1000) {
    const now = Date.now();
    for (const [key, val] of cache) {
      if (now - val.ts > TTL) cache.delete(key);
    }
  }
}

export function invalidateFollowCache(userId: string) {
  cache.delete(userId);
}
