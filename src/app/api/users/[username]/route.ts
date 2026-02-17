import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandling, cachedJson } from "@/lib/api-utils";

async function _GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await resolveSession();
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      displayName: true,
      username: true,
      image: true,
      avatarUrl: true,
      bio: true,
      bannerUrl: true,
      createdAt: true,
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
      // Include follow status in a single query when logged in
      ...(session?.user?.id
        ? {
            followers: {
              where: { followerId: session.user.id },
              select: { id: true },
              take: 1,
            },
          }
        : {}),
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isFollowing =
    session?.user?.id && session.user.id !== user.id
      ? (user as typeof user & { followers?: { id: string }[] }).followers?.length === 1
      : false;

  return cachedJson({
    ...user,
    image: user.avatarUrl ?? user.image,
    followerCount: user._count.followers,
    followingCount: user._count.following,
    postCount: user._count.posts,
    isFollowing,
    isOwnProfile: session?.user?.id === user.id,
    _count: undefined,
    followers: undefined,
  }, {
    scope: session?.user?.id ? "private" : "public",
    maxAge: 60,
    swr: 300,
  });
}
export const GET = withErrorHandling(_GET);
