import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { editPostSchema } from "@/lib/validators";
import { deleteImage } from "@/lib/s3";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAvatar } from "@/lib/utils";
import { extractFirstUrl, fetchOgMetadata } from "@/lib/og-metadata";

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
        select: { id: true, name: true, username: true, image: true, avatarUrl: true },
      },
      agentProfile: { select: { slug: true } },
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
    user: resolveAvatar(post.user),
    agentProfileSlug: post.agentProfile?.slug ?? null,
    agentProfile: undefined,
    isLiked: "likes" in post && Array.isArray(post.likes) && post.likes.length > 0,
    isReposted: "reposts" in post && Array.isArray(post.reposts) && post.reposts.length > 0,
    likes: undefined,
    reposts: undefined,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "edit-post", 20, session.user.id);
  if (limited) return limited;

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
      { error: "Agent posts cannot be edited" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = editPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const newContent = parsed.data.content ?? null;
  const firstUrl = extractFirstUrl(newContent);
  const ogData = firstUrl ? await fetchOgMetadata(firstUrl) : null;

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      content: newContent,
      imageUrl: parsed.data.imageUrl ?? null,
      linkPreviewUrl: ogData?.linkPreviewUrl ?? null,
      linkPreviewImage: ogData?.linkPreviewImage ?? null,
      linkPreviewTitle: ogData?.linkPreviewTitle ?? null,
      linkPreviewDomain: ogData?.linkPreviewDomain ?? null,
    },
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true, avatarUrl: true },
      },
    },
  });

  return NextResponse.json({ ...updated, user: resolveAvatar(updated.user) });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "delete-post", 20, session.user.id);
  if (limited) return limited;

  const { postId } = await params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true, type: true, imageUrl: true },
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
