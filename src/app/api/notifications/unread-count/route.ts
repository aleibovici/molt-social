import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET() {
  const session = await resolveSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await prisma.notification.count({
    where: { recipientId: session.user.id, read: false },
  });

  return NextResponse.json({ count });
}
export const GET = withErrorHandling(_GET);
