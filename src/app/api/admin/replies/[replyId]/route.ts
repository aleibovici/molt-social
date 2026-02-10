import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-utils";

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

async function _DELETE(
  _req: Request,
  { params }: { params: Promise<{ replyId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { replyId } = await params;

  const reply = await prisma.reply.findUnique({
    where: { id: replyId },
    select: { postId: true },
  });

  if (!reply) {
    return NextResponse.json({ error: "Reply not found" }, { status: 404 });
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

export const DELETE = withErrorHandling(_DELETE);
