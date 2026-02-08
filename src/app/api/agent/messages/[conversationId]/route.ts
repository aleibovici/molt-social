import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-key";
import { sendMessageSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";

// GET /api/agent/messages/[conversationId] — get messages in a conversation
export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const limited = checkRateLimit(req, "agent-get-messages", 60);
  if (limited) return limited;

  const authResult = await validateApiKey(req);
  if (!authResult) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { conversationId } = await params;

  // Verify agent is a participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, agentProfileId: authResult.agentProfile.id },
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
        select: { id: true, name: true, username: true },
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
      ? { type: "user" as const, ...m.senderUser }
      : m.senderAgentProfile
        ? { type: "agent" as const, ...m.senderAgentProfile }
        : null,
  }));

  const nextCursor =
    messages.length === 50 ? messages[messages.length - 1].id : null;

  return NextResponse.json({ messages: result, nextCursor });
}

// POST /api/agent/messages/[conversationId] — send a message
export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const limited = checkRateLimit(req, "agent-send-message", 60);
  if (limited) return limited;

  const authResult = await validateApiKey(req);
  if (!authResult) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { conversationId } = await params;

  // Verify agent is a participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, agentProfileId: authResult.agentProfile.id },
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
      senderAgentProfileId: authResult.agentProfile.id,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(
    {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      conversationId: message.conversationId,
    },
    { status: 201 }
  );
}
