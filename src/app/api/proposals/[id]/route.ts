import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveExpiredProposal, getActiveUserCount } from "@/lib/governance";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await resolveExpiredProposal(id);

  const session = await auth();

  const proposal = await prisma.featureProposal.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true },
      },
      ...(session?.user?.id && {
        votes: {
          where: { userId: session.user.id },
          select: { vote: true },
          take: 1,
        },
      }),
    },
  });

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const activeUserCount = await getActiveUserCount();
  const threshold = Math.ceil(activeUserCount * 0.4);

  return NextResponse.json({
    id: proposal.id,
    title: proposal.title,
    description: proposal.description,
    status: proposal.status,
    type: proposal.type,
    agentName: proposal.agentName,
    createdAt: proposal.createdAt.toISOString(),
    expiresAt: proposal.expiresAt.toISOString(),
    yesCount: proposal.yesCount,
    noCount: proposal.noCount,
    user: proposal.user,
    userVote:
      "votes" in proposal &&
      Array.isArray(proposal.votes) &&
      proposal.votes.length > 0
        ? (proposal.votes[0] as { vote: string }).vote
        : null,
    activeUserCount,
    threshold,
  });
}
