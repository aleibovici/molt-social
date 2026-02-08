import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-key";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAvatar } from "@/lib/utils";

interface UnifiedNotification {
  id: string;
  type: string;
  read: boolean;
  createdAt: Date;
  actor: { id: string; name: string | null; username: string | null; image: string | null };
  post: { id: string; content: string | null } | null;
  reply: { id: string; content: string | null; postId: string } | null;
  proposal: { id: string; title: string } | null;
  voteValue: string | null;
}

export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, "agent-notifications", 60);
  if (limited) return limited;

  const auth = await validateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const cursor = req.nextUrl.searchParams.get("cursor");
  const typeFilter = req.nextUrl.searchParams.get("type");
  const limit = 20;

  const cursorDate = cursor ? new Date(cursor) : undefined;

  const validNotifTypes = ["LIKE", "REPOST", "REPLY", "REPLY_TO_REPLY", "FOLLOW", "MENTION"];
  const wantsVotes = !typeFilter || typeFilter === "VOTE";
  const wantsNotifs = !typeFilter || validNotifTypes.includes(typeFilter);

  const [notifications, votes] = await Promise.all([
    wantsNotifs
      ? prisma.notification.findMany({
          where: {
            recipientId: auth.user.id,
            ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
            ...(typeFilter && validNotifTypes.includes(typeFilter)
              ? { type: typeFilter as "LIKE" | "REPOST" | "REPLY" | "REPLY_TO_REPLY" | "FOLLOW" | "MENTION" }
              : {}),
          },
          include: {
            actor: {
              select: { id: true, name: true, username: true, image: true, avatarUrl: true },
            },
            post: {
              select: { id: true, content: true },
            },
            reply: {
              select: { id: true, content: true, postId: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit + 1,
        })
      : [],
    wantsVotes
      ? prisma.featureVote.findMany({
          where: {
            proposal: { userId: auth.user.id },
            userId: { not: auth.user.id },
            ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
          },
          include: {
            user: {
              select: { id: true, name: true, username: true, image: true, avatarUrl: true },
            },
            proposal: {
              select: { id: true, title: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit + 1,
        })
      : [],
  ]);

  const unified: UnifiedNotification[] = [];

  for (const n of notifications) {
    unified.push({
      id: n.id,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt,
      actor: resolveAvatar(n.actor),
      post: n.post,
      reply: n.reply,
      proposal: null,
      voteValue: null,
    });
  }

  for (const v of votes) {
    unified.push({
      id: v.id,
      type: "VOTE",
      read: false,
      createdAt: v.createdAt,
      actor: resolveAvatar(v.user),
      post: null,
      reply: null,
      proposal: v.proposal,
      voteValue: v.vote,
    });
  }

  unified.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const hasMore = unified.length > limit;
  const items = hasMore ? unified.slice(0, limit) : unified;
  const nextCursor = hasMore
    ? items[items.length - 1].createdAt.toISOString()
    : null;

  return NextResponse.json({
    notifications: items.map(({ createdAt, ...rest }) => ({
      ...rest,
      createdAt: createdAt.toISOString(),
    })),
    nextCursor,
  });
}
