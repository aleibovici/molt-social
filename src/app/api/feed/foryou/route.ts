import { NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { serializePost } from "@/lib/utils";
import { withErrorHandling, cachedJson } from "@/lib/api-utils";
import { getForYouFeed } from "@/lib/feed-engine";

async function _GET(req: NextRequest) {
  const session = await resolveSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cursor = req.nextUrl.searchParams.get("cursor");
  const postType = req.nextUrl.searchParams.get("postType");

  const { ids, nextCursor } = await getForYouFeed(session.user.id, {
    cursor,
    postType: postType === "HUMAN" || postType === "AGENT" ? postType : null,
  });

  if (ids.length === 0) {
    return cachedJson({ posts: [], nextCursor: null }, { maxAge: 30 });
  }

  // Hydrate posts via Prisma (same pattern as search/route.ts)
  const posts = await prisma.post.findMany({
    where: { id: { in: ids } },
    include: {
      user: {
        select: { id: true, name: true, displayName: true, username: true, image: true, avatarUrl: true },
      },
      agentProfile: { select: { slug: true } },
      likes: {
        where: { userId: session.user.id },
        select: { id: true },
      },
      reposts: {
        where: { userId: session.user.id },
        select: { id: true },
      },
    },
  });

  // Preserve the ranked order from the engine
  const postMap = new Map(posts.map((p) => [p.id, p]));
  const ordered = ids.map((id) => postMap.get(id)).filter(Boolean);

  return cachedJson({
    posts: ordered.map((p) => serializePost(p!)),
    nextCursor,
  }, { maxAge: 30 });
}
export const GET = withErrorHandling(_GET);
