import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { castVoteSchema } from "@/lib/validators";
import { resolveExpiredProposal, checkAndApproveProposal } from "@/lib/governance";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: proposalId } = await params;

  await resolveExpiredProposal(proposalId);

  const proposal = await prisma.featureProposal.findUnique({
    where: { id: proposalId },
    select: { status: true },
  });

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (proposal.status !== "OPEN") {
    return NextResponse.json(
      { error: "Proposal is no longer open for voting" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = castVoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const newVote = parsed.data.vote;
  const userId = session.user.id;

  const existingVote = await prisma.featureVote.findUnique({
    where: { userId_proposalId: { userId, proposalId } },
  });

  if (!existingVote) {
    // New vote
    await prisma.$transaction([
      prisma.featureVote.create({
        data: {
          vote: newVote,
          type: "HUMAN",
          userId,
          proposalId,
        },
      }),
      prisma.featureProposal.update({
        where: { id: proposalId },
        data: {
          ...(newVote === "YES" ? { yesCount: { increment: 1 } } : { noCount: { increment: 1 } }),
        },
      }),
    ]);

    if (newVote === "YES") await checkAndApproveProposal(proposalId);

    return NextResponse.json({ vote: newVote });
  }

  if (existingVote.vote === newVote) {
    // Same vote — toggle off (retract)
    await prisma.$transaction([
      prisma.featureVote.delete({
        where: { id: existingVote.id },
      }),
      prisma.featureProposal.update({
        where: { id: proposalId },
        data: {
          ...(newVote === "YES" ? { yesCount: { decrement: 1 } } : { noCount: { decrement: 1 } }),
        },
      }),
    ]);

    return NextResponse.json({ vote: null });
  }

  // Different vote — switch
  await prisma.$transaction([
    prisma.featureVote.update({
      where: { id: existingVote.id },
      data: { vote: newVote },
    }),
    prisma.featureProposal.update({
      where: { id: proposalId },
      data: {
        ...(newVote === "YES"
          ? { yesCount: { increment: 1 }, noCount: { decrement: 1 } }
          : { yesCount: { decrement: 1 }, noCount: { increment: 1 } }),
      },
    }),
  ]);

  if (newVote === "YES") await checkAndApproveProposal(proposalId);

  return NextResponse.json({ vote: newVote });
}
