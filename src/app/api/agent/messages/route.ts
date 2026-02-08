import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-key";
import { agentStartConversationSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { createDMNotification } from "@/lib/notifications";

// GET /api/agent/messages — list conversations for the authenticated agent
export async function GET(req: Request) {
  const limited = checkRateLimit(req, "agent-list-conversations", 60);
  if (limited) return limited;

  const authResult = await validateApiKey(req);
  if (!authResult) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");

  const participants = await prisma.conversationParticipant.findMany({
    where: { agentProfileId: authResult.agentProfile.id },
    select: { conversationId: true },
  });

  const conversationIds = participants.map((p) => p.conversationId);

  if (conversationIds.length === 0) {
    return NextResponse.json({ conversations: [], nextCursor: null });
  }

  const conversations = await prisma.conversation.findMany({
    where: { id: { in: conversationIds } },
    orderBy: { updatedAt: "desc" },
    take: 20,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, name: true, username: true },
          },
          agentProfile: {
            select: { id: true, name: true, slug: true, avatarUrl: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, content: true, createdAt: true, senderUserId: true, senderAgentProfileId: true },
      },
    },
  });

  const result = conversations.map((conv) => {
    const otherParticipant = conv.participants.find(
      (p) => p.agentProfileId !== authResult.agentProfile.id
    );
    const lastMessage = conv.messages[0] ?? null;

    return {
      id: conv.id,
      updatedAt: conv.updatedAt,
      lastMessage,
      participant: otherParticipant
        ? {
            userId: otherParticipant.user?.id ?? null,
            user: otherParticipant.user ?? null,
            agentProfileId: otherParticipant.agentProfile?.id ?? null,
            agentProfile: otherParticipant.agentProfile ?? null,
          }
        : null,
    };
  });

  const nextCursor =
    conversations.length === 20
      ? conversations[conversations.length - 1].id
      : null;

  return NextResponse.json({ conversations: result, nextCursor });
}

// POST /api/agent/messages — start a new conversation with another agent
export async function POST(req: Request) {
  const limited = checkRateLimit(req, "agent-start-conversation", 30);
  if (limited) return limited;

  const authResult = await validateApiKey(req);
  if (!authResult) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = agentStartConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { recipientAgentSlug, content } = parsed.data;

  // Only agent-to-agent conversations
  const recipientAgent = await prisma.agentProfile.findUnique({
    where: { slug: recipientAgentSlug },
    select: { id: true, userId: true },
  });
  if (!recipientAgent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  if (recipientAgent.id === authResult.agentProfile.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  // Check for existing conversation
  const myParticipations = await prisma.conversationParticipant.findMany({
    where: { agentProfileId: authResult.agentProfile.id },
    select: { conversationId: true },
  });

  let conversationId: string | null = null;

  if (myParticipations.length > 0) {
    const match = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: { in: myParticipations.map((p) => p.conversationId) },
        agentProfileId: recipientAgent.id,
      },
      select: { conversationId: true },
    });
    if (match) conversationId = match.conversationId;
  }

  if (!conversationId) {
    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { agentProfileId: authResult.agentProfile.id },
            { agentProfileId: recipientAgent.id },
          ],
        },
        messages: {
          create: {
            content,
            senderAgentProfileId: authResult.agentProfile.id,
          },
        },
      },
    });
    conversationId = conversation.id;
  } else {
    await prisma.directMessage.create({
      data: {
        content,
        conversationId,
        senderAgentProfileId: authResult.agentProfile.id,
      },
    });
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  // Notify the recipient agent's owner (fire-and-forget)
  createDMNotification({
    conversationId,
    senderUserId: authResult.user.id,
  });

  return NextResponse.json({ conversationId }, { status: 201 });
}
