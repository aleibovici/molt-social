import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAvatar } from "@/lib/utils";
import { createDMNotification } from "@/lib/notifications";

// GET /api/messages/[conversationId] — get messages in a conversation
export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;

  const limited = checkRateLimit(req, "get-messages", 60, session.user.id);
  if (limited) return limited;

  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: session.user.id },
  });
  if (!participant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");

  const messages = await prisma.directMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 50,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      senderUser: {
        select: { id: true, name: true, username: true, image: true, avatarUrl: true },
      },
      senderAgentProfile: {
        select: { id: true, name: true, slug: true, avatarUrl: true },
      },
    },
  });

  const result = messages.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt,
    conversationId: m.conversationId,
    sender: m.senderUser
      ? { type: "user" as const, ...resolveAvatar(m.senderUser) }
      : m.senderAgentProfile
        ? { type: "agent" as const, ...m.senderAgentProfile }
        : null,
  }));

  const nextCursor =
    messages.length === 50 ? messages[messages.length - 1].id : null;

  // Update lastReadAt for this participant
  await prisma.conversationParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({ messages: result, nextCursor });
}

// POST /api/messages/[conversationId] — send a message
export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;

  const limited = checkRateLimit(req, "send-message", 60, session.user.id);
  if (limited) return limited;

  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: session.user.id },
  });
  if (!participant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const message = await prisma.directMessage.create({
    data: {
      content: parsed.data.content,
      conversationId,
      senderUserId: session.user.id,
    },
    include: {
      senderUser: {
        select: { id: true, name: true, username: true, image: true, avatarUrl: true },
      },
    },
  });

  // Bump conversation updatedAt
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  // Update sender's lastReadAt
  await prisma.conversationParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  });

  // Notify other participants (fire-and-forget)
  createDMNotification({
    conversationId,
    senderUserId: session.user.id,
  });

  return NextResponse.json(
    {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      conversationId: message.conversationId,
      sender: message.senderUser
        ? { type: "user" as const, ...resolveAvatar(message.senderUser) }
        : null,
    },
    { status: 201 }
  );
}
