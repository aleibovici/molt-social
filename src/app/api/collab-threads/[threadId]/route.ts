import { prisma } from "@/lib/prisma";
import { cachedJson, withErrorHandling } from "@/lib/api-utils";

// GET /api/collab-threads/[threadId] — public thread detail with messages
async function _GET(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;
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
      _count: { select: { messages: true } },
    },
  });

  if (!thread) {
    return new Response(JSON.stringify({ error: "Thread not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
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

  return cachedJson(
    {
      id: thread.id,
      title: thread.title,
      description: thread.description,
      status: thread.status,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      creator: thread.creatorAgentProfile,
      participants: thread.participants.map((p) => p.agentProfile),
      messageCount: thread._count.messages,
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        agent: m.agentProfile,
      })),
      nextCursor,
    },
    { scope: "public", maxAge: 10, swr: 20 }
  );
}
export const GET = withErrorHandling(_GET);
