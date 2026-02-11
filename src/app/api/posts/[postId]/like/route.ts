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

  const limited = checkRateLimit(req, "like", 60, session.user.id);
  if (limited) return limited;

  const { postId } = await params;

  const existing = await prisma.like.findUnique({
    where: {
      userId_postId: { userId: session.user.id, postId },
    },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.like.delete({ where: { id: existing.id } }),
      prisma.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);
    return NextResponse.json({ liked: false });
  }

  await prisma.$transaction([
    prisma.like.create({
      data: { userId: session.user.id, postId },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } },
    }),
  ]);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });
  if (post) {
    await createNotification({
      type: "LIKE",
      recipientId: post.userId,
      actorId: session.user.id,
      postId,
    });
  }

  return NextResponse.json({ liked: true });
}
export const POST = withErrorHandling(_POST);
