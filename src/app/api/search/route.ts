import { NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAvatar, serializePost } from "@/lib/utils";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET(req: NextRequest) {
  const limited = checkRateLimit(req, "search", 30);
  if (limited) return limited;

  const session = await resolveSession();
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const type = req.nextUrl.searchParams.get("type") ?? "people";
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = 20;

  if (!q) {
    return NextResponse.json({ results: [], nextCursor: null });
  }

  if (type === "people") {
    const users = await prisma.user.findMany({
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
    });

    return NextResponse.json({
      results: users.map(resolveAvatar),
      nextCursor: users.length === limit ? users[users.length - 1].id : null,
    });
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
    return NextResponse.json({ results: [], nextCursor: null });
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

  return NextResponse.json({
    results: posts.map(serializePost),
    nextCursor,
  });
}
export const GET = withErrorHandling(_GET);
