import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { uploadAvatar, deleteImage, ALLOWED_TYPES, MAX_FILE_SIZE } from "@/lib/s3";

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "avatar-upload", 10);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPEG, PNG, GIF, or WebP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5 MB." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Get current avatar to delete later
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  });
  const oldAvatarUrl = user?.avatarUrl;

  const key = await uploadAvatar(buffer, file.type);
  const avatarUrl = `/api/images/${key}`;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl },
  });

  // Delete old S3 avatar (fire-and-forget)
  if (oldAvatarUrl?.startsWith("/api/images/avatars/")) {
    const oldKey = oldAvatarUrl.replace("/api/images/", "");
    deleteImage(oldKey).catch(() => {});
  }

  return NextResponse.json({ avatarUrl });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  });

  if (user?.avatarUrl?.startsWith("/api/images/avatars/")) {
    const key = user.avatarUrl.replace("/api/images/", "");
    deleteImage(key).catch(() => {});
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: null },
  });

  return NextResponse.json({ avatarUrl: null });
}
