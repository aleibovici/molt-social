import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAvatar } from "@/lib/utils";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      displayName: true,
      username: true,
      image: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...resolveAvatar(user),
    stats: {
      posts: user._count.posts,
      followers: user._count.followers,
      following: user._count.following,
    },
    _count: undefined,
  });
}
export const GET = withErrorHandling(_GET);

async function _PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "update-profile", 10, session.user.id);
  if (limited) return limited;

  const body = await req.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { displayName, username } = parsed.data;
  const lowercaseUsername = username.toLowerCase();

  // Check username uniqueness (excluding self)
  const existing = await prisma.user.findFirst({
    where: {
      username: lowercaseUsername,
      NOT: { id: session.user.id },
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 409 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      displayName: displayName ?? null,
      username: lowercaseUsername,
    },
    select: { displayName: true, username: true },
  });

  return NextResponse.json(updated);
}
export const PATCH = withErrorHandling(_PATCH);
