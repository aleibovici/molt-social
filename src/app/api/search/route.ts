import { NextRequest } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAvatar, serializePost } from "@/lib/utils";
import { withErrorHandling, cachedJson } from "@/lib/api-utils";

async function _GET(req: NextRequest) {
  const limited = checkRateLimit(req, "search", 30);
  if (limited) return limited;

  const session = await resolveSession();
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const type = req.nextUrl.searchParams.get("type") ?? "people";
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = 20;

  const searchCacheOpts = { scope: "public" as const, maxAge: 30, swr: 60 };

  if (!q) {
    return cachedJson({ results: [], nextCursor: null }, searchCacheOpts);
  }

  if (type === "people") {
    const [users, agents] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
          username: { not: null },
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          username: true,
          image: true,
          avatarUrl: true,
          bio: true,
        },
        take: limit,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      }),
      // Also search agent profiles so agents appear in people results
      prisma.agentProfile.findMany({
        where: {
          OR: [
            { slug: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          avatarUrl: true,
          bio: true,
        },
        take: limit,
      }),
    ]);

    const userResults = users.map((u) => ({
      ...resolveAvatar(u),
      resultType: "user" as const,
    }));

    const agentResults = agents.map((a) => ({
      id: a.id,
      name: a.name,
      displayName: a.name,
      username: a.slug,
      image: a.avatarUrl,
      avatarUrl: a.avatarUrl,
      bio: a.bio,
      resultType: "agent" as const,
    }));

    const combined = [...userResults, ...agentResults].slice(0, limit);

    return cachedJson({
      results: combined,
      nextCursor: users.length === limit ? users[users.length - 1].id : null,
    }, searchCacheOpts);
  }

  // Posts search — use PostgreSQL full-text search via websearch_to_tsquery
  const takeCount = limit + 1;
  let idRows: { id: string }[];

  try {
    idRows = cursor
      ? await prisma.$queryRaw<{ id: string }[]>`
          SELECT p.id FROM "Post" p
          WHERE to_tsvector('english', coalesce(p.content, ''))
                @@ websearch_to_tsquery('english', ${q})
            AND (p."createdAt", p.id) < (
              SELECT "createdAt", id FROM "Post" WHERE id = ${cursor}
            )
          ORDER BY p."createdAt" DESC
          LIMIT ${takeCount}
        `
      : await prisma.$queryRaw<{ id: string }[]>`
          SELECT p.id FROM "Post" p
          WHERE to_tsvector('english', coalesce(p.content, ''))
                @@ websearch_to_tsquery('english', ${q})
          ORDER BY p."createdAt" DESC
          LIMIT ${takeCount}
        `;
  } catch {
    // Fallback: if full-text query fails (e.g. unsupported syntax), return empty
    idRows = [];
  }

  const ids = idRows.map((r) => r.id);
  const hasMore = ids.length > limit;
  const pageIds = hasMore ? ids.slice(0, limit) : ids;
  const nextCursor = hasMore ? pageIds[pageIds.length - 1] : null;

  if (pageIds.length === 0) {
    return cachedJson({ results: [], nextCursor: null }, searchCacheOpts);
  }

  const posts = await prisma.post.findMany({
    where: { id: { in: pageIds } },
    include: {
      user: {
        select: { id: true, name: true, displayName: true, username: true, image: true, avatarUrl: true },
      },
      agentProfile: { select: { slug: true } },
      ...(session?.user?.id
        ? {
            likes: {
              where: { userId: session.user.id },
              select: { id: true },
            },
            reposts: {
              where: { userId: session.user.id },
              select: { id: true },
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return cachedJson({
    results: posts.map(serializePost),
    nextCursor,
  }, searchCacheOpts);
}
export const GET = withErrorHandling(_GET);
