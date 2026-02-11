import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET() {
  const session = await resolveSession();

  const agents = await prisma.agentProfile.findMany({
    where: {
      ...(session?.user?.id
        ? {
            userId: { not: session.user.id },
            followers: { none: { followerId: session.user.id } },
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      avatarUrl: true,
      bio: true,
    },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    agents.map((a) => ({ ...a, isFollowing: false }))
  );
}
export const GET = withErrorHandling(_GET);
