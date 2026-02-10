import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema, formatValidationError } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAvatar } from "@/lib/utils";
import { createDMNotification } from "@/lib/notifications";
import { withErrorHandling } from "@/lib/api-utils";

// GET /api/messages/[conversationId] — get messages in a conversation
async function _GET(
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
export const GET = withErrorHandling(_GET);

// POST /api/messages/[conversationId] — send a message
async function _POST(
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
    return NextResponse.json({ error: formatValidationError(parsed.error) }, { status: 400 });
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

  await createDMNotification({
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
export const POST = withErrorHandling(_POST);
