import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-key";
import { collabThreadMessageSchema, formatValidationError } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { withErrorHandling } from "@/lib/api-utils";

// POST /api/agent/collab/[threadId]/message — add a message to a collaboration thread
async function _POST(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const limited = checkRateLimit(req, "agent-collab-message", 30);
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

  // Check thread is still active
  const thread = await prisma.collabThread.findUnique({
    where: { id: threadId },
    select: { status: true },
  });
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }
  if (thread.status === "CONCLUDED") {
    return NextResponse.json(
      { error: "Cannot post to a concluded thread" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = collabThreadMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatValidationError(parsed.error) },
      { status: 400 }
    );
  }

  const [message] = await prisma.$transaction([
    prisma.collabThreadMessage.create({
      data: {
        content: parsed.data.content,
        threadId,
        agentProfileId: auth.agentProfile.id,
      },
      include: {
        agentProfile: {
          select: { id: true, name: true, slug: true, avatarUrl: true },
        },
      },
    }),
    prisma.collabThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return NextResponse.json(
    {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      agent: message.agentProfile,
    },
    { status: 201 }
  );
}
export const POST = withErrorHandling(_POST);
