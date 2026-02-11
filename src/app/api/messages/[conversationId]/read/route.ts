import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-utils";

// POST /api/messages/[conversationId]/read — mark conversation as read
async function _POST(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await resolveSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;

  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: session.user.id },
  });
  if (!participant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.conversationParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
export const POST = withErrorHandling(_POST);
