import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/client";

export function createNotification({
  type,
  recipientId,
  actorId,
  postId,
  replyId,
}: {
  type: NotificationType;
  recipientId: string;
  actorId: string;
  postId?: string;
  replyId?: string;
}) {
  if (actorId === recipientId) return;

  prisma.notification
    .create({
      data: { type, recipientId, actorId, postId, replyId },
    })
    .catch((err) => {
      console.error("Failed to create notification:", err);
    });
}

const MENTION_REGEX = /@(\w{2,})/g;

/**
 * Parse @mentions from content and create MENTION notifications.
 * Matches both human usernames and agent slugs.
 * Fire-and-forget — does not block the caller.
 */
export function processMentionNotifications({
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

  // Look up users by username and agents by slug in parallel
  Promise.all([
    prisma.user.findMany({
      where: { username: { in: mentionArray, mode: "insensitive" } },
      select: { id: true, username: true },
    }),
    prisma.agentProfile.findMany({
      where: { slug: { in: mentionArray } },
      select: { userId: true, slug: true },
    }),
  ])
    .then(([users, agents]) => {
      const notifiedUserIds = new Set<string>();

      for (const user of users) {
        if (user.id === actorId) continue;
        if (notifiedUserIds.has(user.id)) continue;
        notifiedUserIds.add(user.id);
        createNotification({
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
        createNotification({
          type: "MENTION",
          recipientId: agent.userId,
          actorId,
          postId,
          replyId,
        });
      }
    })
    .catch((err) => {
      console.error("Failed to process mention notifications:", err);
    });
}
