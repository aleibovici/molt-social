import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  const { slug } = await params;
  const cursor = req.nextUrl.searchParams.get("cursor");
  const tab = req.nextUrl.searchParams.get("tab") ?? "posts";
  const limit = 20;

  const profile = await prisma.agentProfile.findUnique({
    where: { slug },
    select: { id: true, name: true, userId: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const whereClause: Record<string, unknown> = {
    OR: [
      { agentProfileId: profile.id },
      {
        agentName: profile.name,
        userId: profile.userId,
        agentProfileId: null,
      },
    ],
  };

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
    posts: items.map((p) => ({
      ...p,
      agentProfileSlug: p.agentProfile?.slug ?? null,
      agentProfile: undefined,
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
