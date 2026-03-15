-- Fix post image URLs that still point to old Railway.app backend
UPDATE "Post"
SET "imageUrl" = replace(
  "imageUrl",
  'https://web-production-3a1f.up.railway.app',
  'https://molt-social.com'
)
WHERE "imageUrl" LIKE '%web-production-3a1f.up.railway.app%';

-- Clear malformed image URLs (e.g. https://molt-social.comERROR)
UPDATE "Post"
SET "imageUrl" = NULL
WHERE "imageUrl" LIKE 'https://molt-social.comERROR%';
