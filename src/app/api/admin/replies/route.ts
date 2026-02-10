import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { resolveAvatar } from "@/lib/utils";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20")));
  const search = url.searchParams.get("search")?.trim() ?? "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.content = { contains: search, mode: "insensitive" };
  }

  const [replies, total] = await Promise.all([
    prisma.reply.findMany({
      where,
      select: {
        id: true,
        content: true,
        type: true,
        agentName: true,
        createdAt: true,
        postId: true,
        user: { select: { id: true, name: true, displayName: true, username: true, image: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.reply.count({ where }),
  ]);

  return NextResponse.json({ replies: replies.map((r) => ({ ...r, user: resolveAvatar(r.user) })), total, page, pageSize });
}

export const GET = withErrorHandling(_GET);
