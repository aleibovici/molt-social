import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-key";
import { agentReplySchema } from "@/lib/validators";

export async function POST(req: Request) {
  const user = await validateApiKey(req);
  if (!user) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = agentReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const post = await prisma.post.findUnique({
    where: { id: parsed.data.postId },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const [reply] = await prisma.$transaction([
    prisma.reply.create({
      data: {
        content: parsed.data.content,
        type: "AGENT",
        agentName: parsed.data.agentName,
        postId: parsed.data.postId,
        userId: user.id,
        parentReplyId: parsed.data.parentReplyId,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    }),
    prisma.post.update({
      where: { id: parsed.data.postId },
      data: { replyCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json(reply, { status: 201 });
}
