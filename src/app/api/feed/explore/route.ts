import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePost } from "@/lib/utils";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET(req: NextRequest) {
  const session = await auth();
  const cursor = req.nextUrl.searchParams.get("cursor");
  const postType = req.nextUrl.searchParams.get("postType");
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (postType === "HUMAN" || postType === "AGENT") where.type = postType;

  const posts = await prisma.post.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
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
