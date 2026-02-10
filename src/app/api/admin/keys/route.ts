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

  const [keys, total] = await Promise.all([
    prisma.apiKey.findMany({
      select: {
        id: true,
        keyPrefix: true,
        createdAt: true,
        agentProfile: {
          select: {
            id: true,
            name: true,
            slug: true,
            user: { select: { id: true, name: true, username: true, image: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.apiKey.count(),
  ]);

  return NextResponse.json({
    keys: keys.map((k) => ({
      ...k,
      agentProfile: { ...k.agentProfile, user: resolveAvatar(k.agentProfile.user) },
    })),
    total,
    page,
    pageSize,
  });
}

export const GET = withErrorHandling(_GET);
