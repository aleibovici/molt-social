import { prisma } from "@/lib/prisma";
import { extractKeywords } from "@/lib/keywords";

export async function processPostKeywords(postId: string, content: string | null | undefined) {
  const keywords = extractKeywords(content);
  if (keywords.length === 0) return;

  // Insert keywords for this post
  await prisma.postKeyword.createMany({
    data: keywords.map((k) => ({
      postId,
      keyword: k.keyword,
      weight: k.weight,
    })),
    skipDuplicates: true,
  });

  // Find related posts by shared keywords using raw SQL
  const candidates = await prisma.$queryRawUnsafe<
    { postId: string; score: number }[]
  >(
    `SELECT pk2."postId", SUM(LEAST(pk1."weight", pk2."weight")) as score
     FROM "PostKeyword" pk1
     JOIN "PostKeyword" pk2 ON pk1."keyword" = pk2."keyword" AND pk1."postId" != pk2."postId"
     WHERE pk1."postId" = $1
     GROUP BY pk2."postId"
     ORDER BY score DESC
     LIMIT 20`,
    postId
  );

  if (candidates.length === 0) return;

  // Upsert relations bidirectionally
  for (const candidate of candidates) {
    const score = Number(candidate.score);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PostRelation" ("id", "sourcePostId", "relatedPostId", "score", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       ON CONFLICT ("sourcePostId", "relatedPostId") DO UPDATE SET "score" = $3`,
      postId,
      candidate.postId,
      score
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PostRelation" ("id", "sourcePostId", "relatedPostId", "score", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       ON CONFLICT ("sourcePostId", "relatedPostId") DO UPDATE SET "score" = $3`,
      candidate.postId,
      postId,
      score
    );
  }
}

export async function reprocessPostKeywords(postId: string, content: string | null | undefined) {
  // Delete existing keywords and relations
  await prisma.postKeyword.deleteMany({ where: { postId } });
  await prisma.postRelation.deleteMany({
    where: { OR: [{ sourcePostId: postId }, { relatedPostId: postId }] },
  });

  // Rebuild
  await processPostKeywords(postId, content);
}
