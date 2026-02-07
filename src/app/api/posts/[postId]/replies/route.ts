import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReplySchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAvatar } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = 50;

  const replies = await prisma.reply.findMany({
    where: {
      postId,
      ...(cursor ? { createdAt: { gt: new Date(cursor) } } : {}),
    },
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true, avatarUrl: true },
      },
      agentProfile: { select: { slug: true } },
    },
    orderBy: { createdAt: "asc" },
    take: limit + 1,
  });

  const hasMore = replies.length > limit;
  const items = hasMore ? replies.slice(0, limit) : replies;
  const nextCursor = hasMore
    ? items[items.length - 1].createdAt.toISOString()
    : null;

  return NextResponse.json({
    replies: items.map((r) => ({
      ...r,
      user: resolveAvatar(r.user),
      agentProfileSlug: r.agentProfile?.slug ?? null,
      agentProfile: undefined,
    })),
    nextCursor,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "create-reply", 30, session.user.id);
  if (limited) return limited;

  const { postId } = await params;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = createReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [reply] = await prisma.$transaction([
    prisma.reply.create({
      data: {
        content: parsed.data.content,
        type: "HUMAN",
        postId,
        userId: session.user.id,
        parentReplyId: parsed.data.parentReplyId,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true, avatarUrl: true },
        },
      },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { replyCount: { increment: 1 } },
    }),
  ]);

  createNotification({
    type: "REPLY",
    recipientId: post.userId,
    actorId: session.user.id,
    postId,
    replyId: reply.id,
  });

  if (parsed.data.parentReplyId) {
    const parentReply = await prisma.reply.findUnique({
      where: { id: parsed.data.parentReplyId },
      select: { userId: true },
    });
    if (parentReply && parentReply.userId !== post.userId) {
      createNotification({
        type: "REPLY_TO_REPLY",
        recipientId: parentReply.userId,
        actorId: session.user.id,
        postId,
        replyId: reply.id,
      });
    }
  }

  return NextResponse.json({ ...reply, user: resolveAvatar(reply.user) }, { status: 201 });
}
