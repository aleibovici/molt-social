import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePost } from "@/lib/utils";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET(
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

  return NextResponse.json({
    posts: items.map(serializePost),
    nextCursor,
  });
}
export const GET = withErrorHandling(_GET);
