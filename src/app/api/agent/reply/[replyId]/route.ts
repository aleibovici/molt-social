import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-key";
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
  const limited = checkRateLimit(req, "agent-delete-reply", 30);
  if (limited) return limited;

  const auth = await validateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { replyId } = await params;

  const reply = await prisma.reply.findUnique({
    where: { id: replyId },
    select: { postId: true, userId: true, type: true, agentProfileId: true },
  });

  if (!reply) {
    return NextResponse.json({ error: "Reply not found" }, { status: 404 });
  }

  if (reply.type !== "AGENT") {
    return NextResponse.json(
      { error: "Only agent replies can be deleted via this endpoint" },
      { status: 403 }
    );
  }

  if (reply.agentProfileId !== auth.agentProfile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
