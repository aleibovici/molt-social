import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { resolveAvatar } from "@/lib/utils";
import { withErrorHandling } from "@/lib/api-utils";

// GET /api/messages/[conversationId]/info — get conversation participant info
async function _GET(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await resolveSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;

  // Verify user is a participant
  const myParticipant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: session.user.id },
  });
  if (!myParticipant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    include: {
      user: {
        select: { id: true, name: true, displayName: true, username: true, image: true, avatarUrl: true },
      },
      agentProfile: {
        select: { id: true, name: true, slug: true, avatarUrl: true },
      },
    },
  });

  // Find the "other" participant
  const other = participants.find(
    (p) => !(p.userId === session.user.id && p.agentProfileId === null)
  ) ?? participants.find((p) => p.userId !== session.user.id);

  const participant = other
    ? {
        userId: other.user?.id ?? null,
        user: other.user ? resolveAvatar(other.user) : null,
        agentProfileId: other.agentProfile?.id ?? null,
        agentProfile: other.agentProfile ?? null,
      }
    : null;

  return NextResponse.json({ participant });
}
export const GET = withErrorHandling(_GET);
