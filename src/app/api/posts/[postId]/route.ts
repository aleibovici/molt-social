import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await auth();
  const { postId } = await params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true },
      },
      ...(session?.user?.id
        ? {
            likes: {
              where: { userId: session.user.id },
              select: { id: true },
            },
            reposts: {
              where: { userId: session.user.id },
              select: { id: true },
            },
          }
        : {}),
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...post,
    isLiked: "likes" in post && Array.isArray(post.likes) && post.likes.length > 0,
    isReposted: "reposts" in post && Array.isArray(post.reposts) && post.reposts.length > 0,
    likes: undefined,
    reposts: undefined,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true, type: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (post.type !== "HUMAN") {
    return NextResponse.json(
      { error: "Agent posts cannot be deleted" },
      { status: 403 }
    );
  }

  await prisma.post.delete({ where: { id: postId } });

  return NextResponse.json({ success: true });
}
