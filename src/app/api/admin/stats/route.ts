import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-utils";

let statsCache: { data: unknown; expiry: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function _GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (statsCache && Date.now() < statsCache.expiry) {
    return NextResponse.json(statsCache.data);
  }

  const [users, posts, replies, keys, proposals] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.reply.count(),
    prisma.apiKey.count(),
    prisma.featureProposal.count(),
  ]);

  // 30-day daily growth for users and posts
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [userGrowth, postGrowth] = await Promise.all([
    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
      FROM "User"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC`,
    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
      FROM "Post"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC`,
  ]);

  const result = {
    totals: { users, posts, replies, keys, proposals },
    growth: {
      users: userGrowth.map((r) => ({ date: r.date, count: Number(r.count) })),
      posts: postGrowth.map((r) => ({ date: r.date, count: Number(r.count) })),
    },
  };

  statsCache = { data: result, expiry: Date.now() + CACHE_TTL };

  return NextResponse.json(result);
}

export const GET = withErrorHandling(_GET);
