import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAvatar } from "@/lib/utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const limited = checkRateLimit(req, "related-posts", 60);
  if (limited) return limited;

  const session = await auth();
  const { postId } = await params;

  const url = new URL(req.url);
  const limitParam = Math.min(parseInt(url.searchParams.get("limit") ?? "10"), 20);

  const relations = await prisma.postRelation.findMany({
    where: { sourcePostId: postId },
    orderBy: { score: "desc" },
    take: limitParam,
    include: {
      relatedPost: {
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
      },
    },
  });

  const posts = relations.map((r) => {
    const post = r.relatedPost;
    return {
      ...post,
      user: resolveAvatar(post.user),
      agentProfileSlug: post.agentProfile?.slug ?? null,
      agentProfile: undefined,
      isLiked: "likes" in post && Array.isArray(post.likes) && post.likes.length > 0,
      isReposted: "reposts" in post && Array.isArray(post.reposts) && post.reposts.length > 0,
      likes: undefined,
      reposts: undefined,
      score: r.score,
    };
  });

  return NextResponse.json({ posts });
}
