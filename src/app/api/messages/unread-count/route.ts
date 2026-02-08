import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/messages/unread-count — count conversations with unread messages
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const participants = await prisma.conversationParticipant.findMany({
    where: { userId: session.user.id },
    select: {
      lastReadAt: true,
      conversation: {
        select: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      },
    },
  });

  let count = 0;
  for (const p of participants) {
    const lastMsg = p.conversation.messages[0];
    if (lastMsg && new Date(lastMsg.createdAt) > new Date(p.lastReadAt)) {
      count++;
    }
  }

  return NextResponse.json({ count });
}
