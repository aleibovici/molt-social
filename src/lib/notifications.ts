import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/client";

export async function createNotification({
  type,
  recipientId,
  actorId,
  postId,
  replyId,
  conversationId,
}: {
  type: NotificationType;
  recipientId: string;
  actorId: string;
  postId?: string;
  replyId?: string;
  conversationId?: string;
}) {
  if (actorId === recipientId) return;

  try {
    await prisma.notification.create({
      data: { type, recipientId, actorId, postId, replyId, conversationId },
    });
  } catch (err) {
    console.error(`Failed to create ${type} notification for user ${recipientId}:`, err);
  }
}

/**
 * Create a DIRECT_MESSAGE notification for every other participant in the conversation.
 * For agent participants, the notification is sent to the agent's owner (userId).
 */
export async function createDMNotification({
  conversationId,
  senderUserId,
}: {
  conversationId: string;
  senderUserId: string;
}) {
  try {
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      include: {
        agentProfile: { select: { userId: true } },
      },
    });

    for (const p of participants) {
      const recipientId = p.userId ?? p.agentProfile?.userId;
      if (!recipientId) continue;
      if (recipientId === senderUserId) continue;

      await createNotification({
        type: "DIRECT_MESSAGE",
        recipientId,
        actorId: senderUserId,
        conversationId,
      });
    }
  } catch (err) {
    console.error("Failed to create DM notification:", err);
  }
}

const MENTION_REGEX = /@(\w{2,})/g;

/**
 * Parse @mentions from content and create MENTION notifications.
 * Matches both human usernames and agent slugs.
 */
export async function processMentionNotifications({
  content,
  actorId,
  postId,
  replyId,
}: {
  content: string | null | undefined;
  actorId: string;
  postId?: string;
  replyId?: string;
}) {
  if (!content) return;

  const mentions = new Set<string>();
  let match;
  while ((match = MENTION_REGEX.exec(content)) !== null) {
    mentions.add(match[1].toLowerCase());
  }

  if (mentions.size === 0) return;

  const mentionArray = Array.from(mentions);

  try {
    const [users, agents] = await Promise.all([
      prisma.user.findMany({
        where: { username: { in: mentionArray, mode: "insensitive" } },
        select: { id: true, username: true },
      }),
      prisma.agentProfile.findMany({
        where: { slug: { in: mentionArray } },
        select: { userId: true, slug: true },
      }),
    ]);

    const notifiedUserIds = new Set<string>();

    for (const user of users) {
      if (user.id === actorId) continue;
      if (notifiedUserIds.has(user.id)) continue;
      notifiedUserIds.add(user.id);
      await createNotification({
        type: "MENTION",
        recipientId: user.id,
        actorId,
        postId,
        replyId,
      });
    }

    for (const agent of agents) {
      if (agent.userId === actorId) continue;
      if (notifiedUserIds.has(agent.userId)) continue;
      notifiedUserIds.add(agent.userId);
      await createNotification({
        type: "MENTION",
        recipientId: agent.userId,
        actorId,
        postId,
        replyId,
      });
    }
  } catch (err) {
    console.error("Failed to process mention notifications:", err);
  }
}
