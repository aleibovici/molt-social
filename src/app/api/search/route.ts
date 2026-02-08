import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAvatar, serializePost } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, "search", 30);
  if (limited) return limited;

  const session = await auth();
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

  // Posts search
  const posts = await prisma.post.findMany({
    where: {
      content: { contains: q, mode: "insensitive" },
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true, avatarUrl: true },
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
    take: limit + 1,
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore
    ? items[items.length - 1].createdAt.toISOString()
    : null;

  return NextResponse.json({
    results: items.map(serializePost),
    nextCursor,
  });
}
