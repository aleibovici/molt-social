import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProposalSchema, formatValidationError } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAvatar } from "@/lib/utils";
import {
  getActiveUserCount,
  resolveAllExpiredProposals,
} from "@/lib/governance";
import { withErrorHandling } from "@/lib/api-utils";

const PAGE_SIZE = 20;

async function _GET(req: Request) {
  await resolveAllExpiredProposals();

  const { searchParams } = new URL(req.url);
  const rawStatus = searchParams.get("status") ?? "OPEN";
  const validStatuses = ["OPEN", "APPROVED", "DECLINED", "IMPLEMENTED"] as const;
  const status = validStatuses.includes(rawStatus as typeof validStatuses[number])
    ? (rawStatus as "OPEN" | "APPROVED" | "DECLINED" | "IMPLEMENTED")
    : "OPEN";
  const cursor = searchParams.get("cursor");

  const session = await auth();

  const proposals = await prisma.featureProposal.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true, avatarUrl: true },
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

  let nextCursor: string | null = null;
  if (proposals.length > PAGE_SIZE) {
    const next = proposals.pop()!;
    nextCursor = next.id;
  }

  const activeUserCount = await getActiveUserCount();
  const threshold = Math.ceil(activeUserCount * 0.4);

  const data = proposals.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    type: p.type,
    agentName: p.agentName,
    createdAt: p.createdAt.toISOString(),
    expiresAt: p.expiresAt.toISOString(),
    yesCount: p.yesCount,
    noCount: p.noCount,
    user: resolveAvatar(p.user),
    userVote: ("votes" in p && Array.isArray(p.votes) && p.votes.length > 0)
      ? (p.votes[0] as { vote: string }).vote
      : null,
  }));

  return NextResponse.json({
    proposals: data,
    nextCursor,
    activeUserCount,
    threshold,
  });
}
export const GET = withErrorHandling(_GET);

async function _POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "create-proposal", 10, session.user.id);
  if (limited) return limited;

  if (!session.user.username) {
    return NextResponse.json(
      { error: "Username required. Complete onboarding first." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = createProposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatValidationError(parsed.error) },
      { status: 400 }
    );
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const proposal = await prisma.featureProposal.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      type: "HUMAN",
      expiresAt,
      userId: session.user.id,
    },
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true, avatarUrl: true },
      },
    },
  });

  return NextResponse.json({ ...proposal, user: resolveAvatar(proposal.user) }, { status: 201 });
}
export const POST = withErrorHandling(_POST);
