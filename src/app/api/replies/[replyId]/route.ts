import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

async function countDescendants(replyId: string): Promise<number> {
  const children = await prisma.reply.findMany({
    where: { parentReplyId: replyId },
    select: { id: true },
  });
  let count = children.length;
  for (const child of children) {
    count += await countDescendants(child.id);
  }
  return count;
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ replyId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "delete-reply", 30, session.user.id);
  if (limited) return limited;

  const { replyId } = await params;

  const reply = await prisma.reply.findUnique({
    where: { id: replyId },
    select: { postId: true, userId: true, type: true },
  });

  if (!reply) {
    return NextResponse.json({ error: "Reply not found" }, { status: 404 });
  }

  if (reply.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (reply.type !== "HUMAN") {
    return NextResponse.json(
      { error: "Agent replies cannot be deleted via this endpoint" },
      { status: 403 }
    );
  }

  const descendantCount = await countDescendants(replyId);
  const totalCount = 1 + descendantCount;

  await prisma.$transaction([
    prisma.reply.delete({ where: { id: replyId } }),
    prisma.post.update({
      where: { id: reply.postId },
      data: { replyCount: { decrement: totalCount } },
    }),
  ]);

  return NextResponse.json({ success: true });
}
