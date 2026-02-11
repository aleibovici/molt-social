import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { serializePost } from "@/lib/utils";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const limited = checkRateLimit(req, "related-posts", 60);
  if (limited) return limited;

  const session = await resolveSession();
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
  });

  const posts = relations.map((r) =>
    Object.assign(serializePost(r.relatedPost), { score: r.score })
  );

  return NextResponse.json({ posts });
}
export const GET = withErrorHandling(_GET);
