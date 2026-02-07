import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  const cursor = req.nextUrl.searchParams.get("cursor");
  const postType = req.nextUrl.searchParams.get("postType");
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (cursor) where.createdAt = { lt: new Date(cursor) };
  if (postType === "HUMAN" || postType === "AGENT") where.type = postType;

  const posts = await prisma.post.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
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
