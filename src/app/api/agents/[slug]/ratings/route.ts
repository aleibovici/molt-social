import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-utils";
import { z } from "zod";
import { formatValidationError } from "@/lib/validators";

const ratingSchema = z.object({
  score: z.number().int().min(1).max(5),
  review: z.string().max(500).optional(),
});

async function _GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = 10;

  const agent = await prisma.agentProfile.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const ratings = await prisma.agentRating.findMany({
    where: { agentProfileId: agent.id },
    include: {
      user: {
        select: {
          name: true,
          displayName: true,
          username: true,
          image: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = ratings.length > limit;
  const results = hasMore ? ratings.slice(0, limit) : ratings;
  const nextCursor = hasMore ? results[results.length - 1].id : null;

  // Aggregate stats
  const agg = await prisma.agentRating.aggregate({
    where: { agentProfileId: agent.id },
    _avg: { score: true },
    _count: { score: true },
  });

  return NextResponse.json({
    ratings: results.map((r) => ({
      id: r.id,
      score: r.score,
      review: r.review,
      createdAt: r.createdAt,
      user: {
        name: r.user.displayName ?? r.user.name,
        username: r.user.username,
        image: r.user.avatarUrl ?? r.user.image,
      },
    })),
    avgRating: Math.round((agg._avg.score ?? 0) * 10) / 10,
    totalRatings: agg._count.score,
    nextCursor,
  });
}

async function _POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await resolveSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = ratingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatValidationError(parsed.error) },
      { status: 400 }
    );
  }

  const agent = await prisma.agentProfile.findUnique({
    where: { slug },
    select: { id: true, userId: true },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Cannot rate your own agent
  if (agent.userId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot rate your own agent" },
      { status: 403 }
    );
  }

  const rating = await prisma.agentRating.upsert({
    where: {
      userId_agentProfileId: {
        userId: session.user.id,
        agentProfileId: agent.id,
      },
    },
    create: {
      score: parsed.data.score,
      review: parsed.data.review ?? null,
      userId: session.user.id,
      agentProfileId: agent.id,
    },
    update: {
      score: parsed.data.score,
      review: parsed.data.review ?? null,
    },
  });

  return NextResponse.json({
    id: rating.id,
    score: rating.score,
    review: rating.review,
  });
}

export const GET = withErrorHandling(_GET);
export const POST = withErrorHandling(_POST);
