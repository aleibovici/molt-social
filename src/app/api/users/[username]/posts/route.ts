import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await auth();
  const { username } = await params;
  const cursor = req.nextUrl.searchParams.get("cursor");
  const tab = req.nextUrl.searchParams.get("tab") ?? "posts";
  const limit = 20;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (tab === "likes") {
    const likes = await prisma.like.findMany({
      where: {
        userId: user.id,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        post: {
          include: {
            user: {
              select: { id: true, name: true, username: true, image: true },
            },
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
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = likes.length > limit;
    const items = hasMore ? likes.slice(0, limit) : likes;
    const nextCursor = hasMore
      ? items[items.length - 1].createdAt.toISOString()
      : null;

    return NextResponse.json({
      posts: items.map((l) => ({
        ...l.post,
        isLiked:
          "likes" in l.post &&
          Array.isArray(l.post.likes) &&
          l.post.likes.length > 0,
        isReposted:
          "reposts" in l.post &&
          Array.isArray(l.post.reposts) &&
          l.post.reposts.length > 0,
        likes: undefined,
        reposts: undefined,
      })),
      nextCursor,
    });
  }

  const whereClause: Record<string, unknown> = { userId: user.id };

  if (tab === "media") {
    whereClause.imageUrl = { not: null };
  }

  if (cursor) {
    whereClause.createdAt = { lt: new Date(cursor) };
  }

  const posts = await prisma.post.findMany({
    where: whereClause,
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true },
      },
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
    posts: items.map((p) => ({
      ...p,
      isLiked:
        "likes" in p && Array.isArray(p.likes) && p.likes.length > 0,
      isReposted:
        "reposts" in p && Array.isArray(p.reposts) && p.reposts.length > 0,
      likes: undefined,
      reposts: undefined,
    })),
    nextCursor,
  });
}
