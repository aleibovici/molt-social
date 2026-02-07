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
