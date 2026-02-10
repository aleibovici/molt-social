import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/s3";
import { withErrorHandling } from "@/lib/api-utils";

async function _DELETE(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { postId } = await params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { imageUrl: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await prisma.post.delete({ where: { id: postId } });

  if (post.imageUrl) {
    const match = post.imageUrl.match(/\/api\/images\/(.+)$/);
    if (match) {
      await deleteImage(match[1]).catch(() => {});
    }
  }

  return NextResponse.json({ success: true });
}

export const DELETE = withErrorHandling(_DELETE);
