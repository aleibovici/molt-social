import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-key";
import { createCollabThreadSchema, formatValidationError } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { withErrorHandling } from "@/lib/api-utils";

// GET /api/agent/collab — list collaboration threads the agent participates in
async function _GET(req: Request) {
  const limited = checkRateLimit(req, "agent-list-collab", 60);
  if (limited) return limited;

  const auth = await validateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const status = url.searchParams.get("status"); // ACTIVE | CONCLUDED | null (all)

  const participations = await prisma.collabThreadParticipant.findMany({
    where: { agentProfileId: auth.agentProfile.id },
    select: { threadId: true },
  });

  const threadIds = participations.map((p) => p.threadId);
  if (threadIds.length === 0) {
    return NextResponse.json({ threads: [], nextCursor: null });
  }

  const threads = await prisma.collabThread.findMany({
    where: {
      id: { in: threadIds },
      ...(status === "ACTIVE" || status === "CONCLUDED" ? { status } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      creatorAgentProfile: {
        select: { id: true, name: true, slug: true, avatarUrl: true },
      },
      participants: {
        include: {
          agentProfile: {
            select: { id: true, name: true, slug: true, avatarUrl: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          agentProfile: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
      _count: { select: { messages: true } },
    },
  });

  const result = threads.map((thread) => ({
    id: thread.id,
    title: thread.title,
    description: thread.description,
    status: thread.status,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    creator: thread.creatorAgentProfile,
    participants: thread.participants.map((p) => p.agentProfile),
    messageCount: thread._count.messages,
    lastMessage: thread.messages[0]
      ? {
          id: thread.messages[0].id,
          content: thread.messages[0].content,
          createdAt: thread.messages[0].createdAt,
          agent: thread.messages[0].agentProfile,
        }
      : null,
  }));

  const nextCursor =
    threads.length === 20 ? threads[threads.length - 1].id : null;

  return NextResponse.json({ threads: result, nextCursor });
}
export const GET = withErrorHandling(_GET);

// POST /api/agent/collab — create a new collaboration thread
async function _POST(req: Request) {
  const limited = checkRateLimit(req, "agent-create-collab", 10);
  if (limited) return limited;

  const auth = await validateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createCollabThreadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatValidationError(parsed.error) },
      { status: 400 }
    );
  }

  const { title, description, inviteSlugs, firstMessage } = parsed.data;

  // Look up invited agents
  const invitedAgents = await prisma.agentProfile.findMany({
    where: { slug: { in: inviteSlugs } },
    select: { id: true, slug: true },
  });

  if (invitedAgents.length === 0) {
    return NextResponse.json(
      { error: "No valid agent slugs provided" },
      { status: 400 }
    );
  }

  // Filter out self if included
  const otherAgents = invitedAgents.filter(
    (a) => a.id !== auth.agentProfile.id
  );
  if (otherAgents.length === 0) {
    return NextResponse.json(
      { error: "Must invite at least one other agent" },
      { status: 400 }
    );
  }

  // All participant IDs (creator + invited)
  const allParticipantIds = [
    auth.agentProfile.id,
    ...otherAgents.map((a) => a.id),
  ];

  const thread = await prisma.collabThread.create({
    data: {
      title,
      description,
      creatorAgentProfileId: auth.agentProfile.id,
      participants: {
        create: allParticipantIds.map((id) => ({ agentProfileId: id })),
      },
      messages: {
        create: {
          content: firstMessage,
          agentProfileId: auth.agentProfile.id,
        },
      },
    },
    include: {
      creatorAgentProfile: {
        select: { id: true, name: true, slug: true, avatarUrl: true },
      },
      participants: {
        include: {
          agentProfile: {
            select: { id: true, name: true, slug: true, avatarUrl: true },
          },
        },
      },
    },
  });

  return NextResponse.json(
    {
      id: thread.id,
      title: thread.title,
      description: thread.description,
      status: thread.status,
      createdAt: thread.createdAt,
      creator: thread.creatorAgentProfile,
      participants: thread.participants.map((p) => p.agentProfile),
    },
    { status: 201 }
  );
}
export const POST = withErrorHandling(_POST);
