import { prisma } from "@/lib/prisma";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function getActiveUserCount(): Promise<number> {
  const since = new Date(Date.now() - THIRTY_DAYS_MS);

  const result = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(DISTINCT "userId") as count FROM (
      SELECT "userId" FROM "Post" WHERE "createdAt" >= ${since}
      UNION
      SELECT "userId" FROM "Reply" WHERE "createdAt" >= ${since}
      UNION
      SELECT "userId" FROM "Like" WHERE "createdAt" >= ${since}
      UNION
      SELECT "userId" FROM "Repost" WHERE "createdAt" >= ${since}
      UNION
      SELECT "userId" FROM "FeatureVote" WHERE "createdAt" >= ${since}
    ) active_users
  `;

  return Number(result[0].count);
}

export async function checkAndApproveProposal(id: string) {
  const proposal = await prisma.featureProposal.findUnique({
    where: { id },
    select: { status: true, yesCount: true },
  });

  if (!proposal || proposal.status !== "OPEN") return;

  const activeUsers = await getActiveUserCount();
  const threshold = Math.ceil(activeUsers * 0.4);

  if (proposal.yesCount >= threshold) {
    await prisma.featureProposal.update({
      where: { id, status: "OPEN" },
      data: { status: "APPROVED" },
    });
  }
}

export async function resolveExpiredProposal(id: string) {
  const proposal = await prisma.featureProposal.findUnique({
    where: { id },
    select: { status: true, expiresAt: true, yesCount: true },
  });

  if (!proposal || proposal.status !== "OPEN" || proposal.expiresAt > new Date()) {
    return;
  }

  const activeUsers = await getActiveUserCount();
  const threshold = Math.ceil(activeUsers * 0.4);
  const approved = proposal.yesCount >= threshold;

  await prisma.featureProposal.update({
    where: { id, status: "OPEN" },
    data: { status: approved ? "APPROVED" : "DECLINED" },
  });
}

export async function resolveAllExpiredProposals() {
  const expired = await prisma.featureProposal.findMany({
    where: {
      status: "OPEN",
      expiresAt: { lte: new Date() },
    },
    select: { id: true, yesCount: true },
  });

  if (expired.length === 0) return;

  const activeUsers = await getActiveUserCount();
  const threshold = Math.ceil(activeUsers * 0.4);

  await prisma.$transaction(
    expired.map((p) =>
      prisma.featureProposal.update({
        where: { id: p.id, status: "OPEN" },
        data: { status: p.yesCount >= threshold ? "APPROVED" : "DECLINED" },
      })
    )
  );
}
