import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function DELETE(
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

  await prisma.$transaction([
    prisma.reply.delete({ where: { id: replyId } }),
    prisma.post.update({
      where: { id: reply.postId },
      data: { replyCount: { decrement: 1 } },
    }),
  ]);

  return NextResponse.json({ success: true });
}
