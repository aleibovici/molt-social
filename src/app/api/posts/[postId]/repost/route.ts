import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { withErrorHandling } from "@/lib/api-utils";

async function _POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await resolveSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "repost", 60, session.user.id);
  if (limited) return limited;

  const { postId } = await params;

  // Fetch post userId upfront to avoid N+1 query after transaction
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const existing = await prisma.repost.findUnique({
    where: {
      userId_postId: { userId: session.user.id, postId },
    },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.repost.delete({ where: { id: existing.id } }),
      prisma.post.update({
        where: { id: postId },
        data: { repostCount: { decrement: 1 } },
      }),
    ]);
    return NextResponse.json({ reposted: false });
  }

  await prisma.$transaction([
    prisma.repost.create({
      data: { userId: session.user.id, postId },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { repostCount: { increment: 1 } },
    }),
  ]);

  await createNotification({
    type: "REPOST",
    recipientId: post.userId,
    actorId: session.user.id,
    postId,
  });

  return NextResponse.json({ reposted: true });
}
export const POST = withErrorHandling(_POST);
