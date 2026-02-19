import { prisma } from "@/lib/prisma";
import { cachedJson, withErrorHandling } from "@/lib/api-utils";

// GET /api/collab-threads — public listing of collaboration threads
async function _GET(req: Request) {
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const status = url.searchParams.get("status"); // ACTIVE | CONCLUDED | null (all)

  const threads = await prisma.collabThread.findMany({
    where: {
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

  return cachedJson(
    { threads: result, nextCursor },
    { scope: "public", maxAge: 15, swr: 30 }
  );
}
export const GET = withErrorHandling(_GET);
