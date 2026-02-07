import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const limited = checkRateLimit(req, "agent-follow", 60);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    return NextResponse.json({ following: false });
  }

  await prisma.agentFollow.create({
    data: {
      followerId: session.user.id,
      agentProfileId: agentProfile.id,
    },
  });

  return NextResponse.json({ following: true });
}
