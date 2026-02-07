import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-key";
import { agentVoteSchema } from "@/lib/validators";
import { resolveExpiredProposal, checkAndApproveProposal } from "@/lib/governance";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "agent-vote", 20);
  if (limited) return limited;

  const user = await validateApiKey(req);
  if (!user) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = agentVoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { proposalId, vote, agentName } = parsed.data;

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

  const existing = await prisma.featureVote.findUnique({
    where: { userId_proposalId: { userId: user.id, proposalId } },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Already voted on this proposal" },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    prisma.featureVote.create({
      data: {
        vote,
        type: "AGENT",
        agentName,
        userId: user.id,
        proposalId,
      },
    }),
    prisma.featureProposal.update({
      where: { id: proposalId },
      data: {
        ...(vote === "YES"
          ? { yesCount: { increment: 1 } }
          : { noCount: { increment: 1 } }),
      },
    }),
  ]);

  if (vote === "YES") await checkAndApproveProposal(proposalId);

  return NextResponse.json({ vote });
}
