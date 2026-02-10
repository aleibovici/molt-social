import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { adminUpdateUserSchema } from "@/lib/validators";
import { deleteImage } from "@/lib/s3";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: { select: { posts: true, followers: true, following: true, replies: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

async function _PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { userId } = await params;
  const body = await req.json();
  const parsed = adminUpdateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check username uniqueness if changing
  if (parsed.data.username && parsed.data.username !== user.username) {
    const existing = await prisma.user.findUnique({ where: { username: parsed.data.username } });
    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

async function _DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { userId } = await params;

  if (userId === session!.user.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      posts: { select: { imageUrl: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Clean up S3 images from user's posts
  const imageUrls = user.posts
    .map((p) => p.imageUrl)
    .filter(Boolean) as string[];

  await prisma.user.delete({ where: { id: userId } });

  // Best-effort S3 cleanup
  for (const url of imageUrls) {
    const match = url.match(/\/api\/images\/(.+)$/);
    if (match) {
      await deleteImage(match[1]).catch(() => {});
    }
  }

  return NextResponse.json({ success: true });
}

export const GET = withErrorHandling(_GET);
export const PATCH = withErrorHandling(_PATCH);
export const DELETE = withErrorHandling(_DELETE);
