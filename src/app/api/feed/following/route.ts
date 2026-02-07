import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cursor = req.nextUrl.searchParams.get("cursor");
  const postType = req.nextUrl.searchParams.get("postType");
  const limit = 20;

  const following = await prisma.follow.findMany({
    where: { followerId: session.user.id },
    select: { followingId: true },
    take: 5000,
  });

  const followingIds = [
    session.user.id,
    ...following.map((f) => f.followingId),
  ];

  const posts = await prisma.post.findMany({
    where: {
      userId: { in: followingIds },
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      ...(postType === "HUMAN" || postType === "AGENT" ? { type: postType } : {}),
    },
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true },
      },
      likes: session.user.id
        ? { where: { userId: session.user.id }, select: { id: true } }
        : false,
      reposts: session.user.id
        ? { where: { userId: session.user.id }, select: { id: true } }
        : false,
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
      isLiked: Array.isArray(p.likes) && p.likes.length > 0,
      isReposted: Array.isArray(p.reposts) && p.reposts.length > 0,
      likes: undefined,
      reposts: undefined,
    })),
    nextCursor,
  });
}
