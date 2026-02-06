import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await auth();
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
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
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let isFollowing = false;
  if (session?.user?.id && session.user.id !== user.id) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: user.id,
        },
      },
    });
    isFollowing = !!follow;
  }

  return NextResponse.json({
    ...user,
    followerCount: user._count.followers,
    followingCount: user._count.following,
    postCount: user._count.posts,
    isFollowing,
    isOwnProfile: session?.user?.id === user.id,
    _count: undefined,
  });
}
