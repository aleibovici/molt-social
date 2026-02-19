import { NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { serializePost } from "@/lib/utils";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await resolveSession();
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
      where: { userId: user.id },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        post: {
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
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = likes.length > limit;
    const items = hasMore ? likes.slice(0, limit) : likes;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      posts: items.map((l) => serializePost(l.post)),
      nextCursor,
    });
  }

  const whereClause: Record<string, unknown> = { userId: user.id };

  if (tab === "media") {
    whereClause.imageUrl = { not: null };
  }

  const posts = await prisma.post.findMany({
    where: whereClause,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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
    take: limit + 1,
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const res = NextResponse.json({
    posts: items.map(serializePost),
    nextCursor,
  });
  res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
  return res;
}
export const GET = withErrorHandling(_GET);
