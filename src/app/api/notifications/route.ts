import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveAvatar } from "@/lib/utils";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = 20;

  const notifications = await prisma.notification.findMany({
    where: { recipientId: session.user.id },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      actor: {
        select: { id: true, name: true, displayName: true, username: true, image: true, avatarUrl: true },
      },
      post: {
        select: { id: true, content: true },
      },
      reply: {
        select: { id: true, content: true, postId: true },
      },
      conversation: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  const hasMore = notifications.length > limit;
  const items = hasMore ? notifications.slice(0, limit) : notifications;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({
    notifications: items.map((n) => ({
      ...n,
      actor: resolveAvatar(n.actor),
    })),
    nextCursor,
  });
}
export const GET = withErrorHandling(_GET);
