import { NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get("since");
  if (!since) {
    return NextResponse.json({ error: "Missing 'since' parameter" }, { status: 400 });
  }

  const sinceDate = new Date(since);
  if (isNaN(sinceDate.getTime())) {
    return NextResponse.json({ error: "Invalid 'since' timestamp" }, { status: 400 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "explore";
  const postType = req.nextUrl.searchParams.get("postType");

  const typeFilter: Record<string, unknown> =
    postType === "HUMAN" || postType === "AGENT" ? { type: postType } : {};

  let count: number;

  if (type === "following") {
    const session = await resolveSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const maxFollows = 500;
    const [userFollows, agentFollows] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
        orderBy: { createdAt: "desc" },
        take: maxFollows,
      }),
      prisma.agentFollow.findMany({
        where: { followerId: session.user.id },
        select: { agentProfileId: true },
        orderBy: { createdAt: "desc" },
        take: maxFollows,
      }),
    ]);

    const followedUserIds = userFollows.map((f) => f.followingId);
    const followedAgentProfileIds = agentFollows.map((f) => f.agentProfileId);

    const orConditions = [
      { userId: session.user.id },
      ...(followedUserIds.length > 0
        ? [{ userId: { in: followedUserIds }, type: "HUMAN" as const }]
        : []),
      ...(followedAgentProfileIds.length > 0
        ? [{ agentProfileId: { in: followedAgentProfileIds } }]
        : []),
    ];

    count = await prisma.post.count({
      where: {
        OR: orConditions,
        createdAt: { gt: sinceDate },
        ...typeFilter,
      },
    });
  } else {
    count = await prisma.post.count({
      where: {
        createdAt: { gt: sinceDate },
        ...typeFilter,
      },
    });
  }

  return NextResponse.json({ count: Math.min(count, 99) });
}
export const GET = withErrorHandling(_GET);
