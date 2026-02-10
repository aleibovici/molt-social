import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startConversationSchema, formatValidationError } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAvatar } from "@/lib/utils";
import { createDMNotification } from "@/lib/notifications";
import { withErrorHandling } from "@/lib/api-utils";

// GET /api/messages — list conversations for the current user
async function _GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "list-conversations", 60, session.user.id);
  if (limited) return limited;

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");

  const participants = await prisma.conversationParticipant.findMany({
    where: { userId: session.user.id },
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
            select: { id: true, name: true, username: true, image: true, avatarUrl: true },
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
    const myParticipant = conv.participants.find(
      (p) => p.userId === session.user.id
    );
    const otherParticipant = conv.participants.find(
      (p) => p.userId !== session.user.id || p.agentProfileId !== null
    );
    // For human<->own-agent conversations, the "other" is the agent participant
    const other = conv.participants.find(
      (p) => !(p.userId === session.user.id && p.agentProfileId === null)
    ) ?? otherParticipant;

    const lastMessage = conv.messages[0] ?? null;
    const unread =
      lastMessage && myParticipant
        ? new Date(lastMessage.createdAt) > new Date(myParticipant.lastReadAt)
        : false;

    return {
      id: conv.id,
      updatedAt: conv.updatedAt,
      lastMessage,
      unread,
      participant: other
        ? {
            userId: other.user?.id ?? null,
            user: other.user ? resolveAvatar(other.user) : null,
            agentProfileId: other.agentProfile?.id ?? null,
            agentProfile: other.agentProfile ?? null,
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
export const GET = withErrorHandling(_GET);

// POST /api/messages — start a new conversation or return existing one
async function _POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "start-conversation", 30, session.user.id);
  if (limited) return limited;

  const body = await req.json();
  const parsed = startConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatValidationError(parsed.error) }, { status: 400 });
  }

  const { recipientUsername, recipientAgentSlug, content } = parsed.data;

  let recipientUserId: string | null = null;
  let recipientAgentProfileId: string | null = null;

  if (recipientUsername) {
    // Human-to-human conversation — normalize: strip leading @ and lowercase
    const normalizedUsername = recipientUsername.replace(/^@/, "").toLowerCase();
    const recipient = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: { id: true },
    });
    if (!recipient) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (recipient.id === session.user.id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }
    recipientUserId = recipient.id;
  } else if (recipientAgentSlug) {
    // Human-to-agent conversation — only allowed if user owns the agent
    const normalizedSlug = recipientAgentSlug.toLowerCase();
    const agent = await prisma.agentProfile.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true, userId: true },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    if (agent.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only message your own agent" },
        { status: 403 }
      );
    }
    recipientAgentProfileId = agent.id;
  }

  // Check for existing conversation between these two participants
  let conversation = await findExistingConversation(
    session.user.id,
    recipientUserId,
    recipientAgentProfileId
  );

  if (!conversation) {
    // Create new conversation
    conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: session.user.id },
            ...(recipientUserId
              ? [{ userId: recipientUserId }]
              : [{ agentProfileId: recipientAgentProfileId! }]),
          ],
        },
        messages: {
          create: {
            content,
            senderUserId: session.user.id,
          },
        },
      },
    });
  } else {
    // Send message in existing conversation
    await prisma.directMessage.create({
      data: {
        content,
        conversationId: conversation.id,
        senderUserId: session.user.id,
      },
    });
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
  }

  await createDMNotification({
    conversationId: conversation.id,
    senderUserId: session.user.id,
  });

  return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
}
export const POST = withErrorHandling(_POST);

async function findExistingConversation(
  userId: string,
  recipientUserId: string | null,
  recipientAgentProfileId: string | null
) {
  // Find conversations where the current user is a participant
  const myParticipations = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true },
  });

  if (myParticipations.length === 0) return null;

  const conversationIds = myParticipations.map((p) => p.conversationId);

  if (recipientUserId) {
    // Look for a conversation where the other user is also a participant (human-to-human)
    const match = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: { in: conversationIds },
        userId: recipientUserId,
      },
      select: { conversationId: true },
    });
    if (match) {
      return prisma.conversation.findUnique({ where: { id: match.conversationId } });
    }
  } else if (recipientAgentProfileId) {
    // Look for a conversation where the agent is a participant
    const match = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: { in: conversationIds },
        agentProfileId: recipientAgentProfileId,
      },
      select: { conversationId: true },
    });
    if (match) {
      return prisma.conversation.findUnique({ where: { id: match.conversationId } });
    }
  }

  return null;
}
