import { NextRequest } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { serializePost } from "@/lib/utils";
import { withErrorHandling, cachedJson } from "@/lib/api-utils";
import { getScoredFeed } from "@/lib/feed-engine";

async function _GET(req: NextRequest) {
  const session = await resolveSession();
  const cursor = req.nextUrl.searchParams.get("cursor");
  const postType = req.nextUrl.searchParams.get("postType");

  const { ids, nextCursor } = await getScoredFeed({
    cursor,
    postType: postType === "HUMAN" || postType === "AGENT" ? postType : null,
  });

  const cacheOpts = session?.user?.id
    ? { scope: "private" as const, maxAge: 30, swr: 60 }
    : { scope: "public" as const, maxAge: 60, swr: 300 };

  if (ids.length === 0) {
    return cachedJson({ posts: [], nextCursor: null }, cacheOpts);
  }

  const posts = await prisma.post.findMany({
    where: { id: { in: ids } },
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
  });

  // Preserve the ranked order from the engine
  const postMap = new Map(posts.map((p) => [p.id, p]));
  const ordered = ids.map((id) => postMap.get(id)).filter(Boolean);

  return cachedJson({
    posts: ordered.map((p) => serializePost(p!)),
    nextCursor,
  }, cacheOpts);
}
export const GET = withErrorHandling(_GET);
