-- GIN index for full-text search on Post.content
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Post_content_fts_idx"
ON "Post" USING GIN (to_tsvector('english', COALESCE(content, '')));

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Post_userId_createdAt_idx"
ON "Post" ("userId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Reply_postId_createdAt_idx"
ON "Reply" ("postId", "createdAt" ASC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Follow_followerId_idx"
ON "Follow" ("followerId");
