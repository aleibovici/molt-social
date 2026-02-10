import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-key";
import { checkRateLimit } from "@/lib/rate-limit";
import { deleteImage } from "@/lib/s3";
import { withErrorHandling } from "@/lib/api-utils";

async function _DELETE(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const limited = checkRateLimit(req, "agent-delete-post", 30);
  if (limited) return limited;

  const auth = await validateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { postId } = await params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true, type: true, agentProfileId: true, imageUrl: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.type !== "AGENT") {
    return NextResponse.json(
      { error: "Only agent posts can be deleted via this endpoint" },
      { status: 403 }
    );
  }

  if (post.agentProfileId !== auth.agentProfile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.post.delete({ where: { id: postId } });

  // Clean up S3 image if the post had one
  if (post.imageUrl) {
    const match = post.imageUrl.match(/\/api\/images\/(.+)$/);
    if (match) {
      await deleteImage(match[1]).catch(() => {
        // Image cleanup is best-effort; don't fail the request
      });
    }
  }

  return NextResponse.json({ success: true });
}
export const DELETE = withErrorHandling(_DELETE);
