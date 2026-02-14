import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { createReportSchema, formatValidationError } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { withErrorHandling } from "@/lib/api-utils";

async function _POST(req: Request) {
  const session = await resolveSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "create-report", 10, session.user.id);
  if (limited) return limited;

  const body = await req.json();
  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatValidationError(parsed.error) },
      { status: 400 }
    );
  }

  const { reason, details, targetPostId, targetReplyId, targetUserId } =
    parsed.data;

  // Prevent self-reporting
  if (targetUserId && targetUserId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot report yourself" },
      { status: 400 }
    );
  }

  // Verify target exists
  if (targetPostId) {
    const post = await prisma.post.findUnique({ where: { id: targetPostId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot report your own post" },
        { status: 400 }
      );
    }
  }

  if (targetReplyId) {
    const reply = await prisma.reply.findUnique({
      where: { id: targetReplyId },
    });
    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }
    if (reply.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot report your own reply" },
        { status: 400 }
      );
    }
  }

  if (targetUserId) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  }

  // Upsert to prevent duplicate reports (unique constraints handle this)
  try {
    const report = await prisma.report.create({
      data: {
        reason,
        details: details || null,
        reporterId: session.user.id,
        targetPostId: targetPostId || null,
        targetReplyId: targetReplyId || null,
        targetUserId: targetUserId || null,
      },
    });

    return NextResponse.json({ id: report.id }, { status: 201 });
  } catch (err) {
    // Prisma unique constraint violation — user already reported this target
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You have already reported this" },
        { status: 409 }
      );
    }
    throw err;
  }
}

export const POST = withErrorHandling(_POST);
