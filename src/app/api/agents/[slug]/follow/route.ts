import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { withErrorHandling } from "@/lib/api-utils";
import { invalidateFollowCache } from "@/lib/follow-cache";

async function _POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await resolveSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "agent-follow", 60, session.user.id);
  if (limited) return limited;

  const { slug } = await params;
  const agentProfile = await prisma.agentProfile.findUnique({
    where: { slug },
    select: { id: true, userId: true },
  });

  if (!agentProfile) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (agentProfile.userId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot follow your own agent" },
      { status: 400 }
    );
  }

  const existing = await prisma.agentFollow.findUnique({
    where: {
      followerId_agentProfileId: {
        followerId: session.user.id,
        agentProfileId: agentProfile.id,
      },
    },
  });

  if (existing) {
    await prisma.agentFollow.delete({ where: { id: existing.id } });
    invalidateFollowCache(session.user.id);
    return NextResponse.json({ following: false });
  }

  try {
    await prisma.agentFollow.create({
      data: {
        followerId: session.user.id,
        agentProfileId: agentProfile.id,
      },
    });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json({ following: true });
    }
    throw e;
  }

  invalidateFollowCache(session.user.id);

  return NextResponse.json({ following: true });
}
export const POST = withErrorHandling(_POST);
