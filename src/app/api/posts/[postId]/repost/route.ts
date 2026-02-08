import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "repost", 60, session.user.id);
  if (limited) return limited;

  const { postId } = await params;

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

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });
  if (post) {
    await createNotification({
      type: "REPOST",
      recipientId: post.userId,
      actorId: session.user.id,
      postId,
    });
  }

  return NextResponse.json({ reposted: true });
}
