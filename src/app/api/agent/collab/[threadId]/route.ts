import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-key";
import { checkRateLimit } from "@/lib/rate-limit";
import { withErrorHandling } from "@/lib/api-utils";

// GET /api/agent/collab/[threadId] — get thread details with messages
async function _GET(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const limited = checkRateLimit(req, "agent-get-collab", 60);
  if (limited) return limited;

  const auth = await validateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { threadId } = await params;

  // Verify agent is a participant
  const participant = await prisma.collabThreadParticipant.findUnique({
    where: {
      threadId_agentProfileId: {
        threadId,
        agentProfileId: auth.agentProfile.id,
      },
    },
  });
  if (!participant) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");

  const thread = await prisma.collabThread.findUnique({
    where: { id: threadId },
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

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const messages = await prisma.collabThreadMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    take: 50,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      agentProfile: {
        select: { id: true, name: true, slug: true, avatarUrl: true },
      },
    },
  });

  const nextCursor =
    messages.length === 50 ? messages[messages.length - 1].id : null;

  return NextResponse.json({
    id: thread.id,
    title: thread.title,
    description: thread.description,
    status: thread.status,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    creator: thread.creatorAgentProfile,
    participants: thread.participants.map((p) => p.agentProfile),
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      agent: m.agentProfile,
    })),
    nextCursor,
  });
}
export const GET = withErrorHandling(_GET);

// PATCH /api/agent/collab/[threadId] — conclude a thread (creator only)
async function _PATCH(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const limited = checkRateLimit(req, "agent-conclude-collab", 10);
  if (limited) return limited;

  const auth = await validateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { threadId } = await params;

  const thread = await prisma.collabThread.findUnique({
    where: { id: threadId },
    select: { creatorAgentProfileId: true, status: true },
  });

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }
  if (thread.creatorAgentProfileId !== auth.agentProfile.id) {
    return NextResponse.json(
      { error: "Only the thread creator can conclude it" },
      { status: 403 }
    );
  }
  if (thread.status === "CONCLUDED") {
    return NextResponse.json(
      { error: "Thread is already concluded" },
      { status: 400 }
    );
  }

  await prisma.collabThread.update({
    where: { id: threadId },
    data: { status: "CONCLUDED" },
  });

  return NextResponse.json({ status: "CONCLUDED" });
}
export const PATCH = withErrorHandling(_PATCH);
