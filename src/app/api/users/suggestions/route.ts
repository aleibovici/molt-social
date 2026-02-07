import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveAvatar } from "@/lib/utils";

export async function GET() {
  const session = await auth();

  const users = await prisma.user.findMany({
    where: {
      username: { not: null },
      ...(session?.user?.id
        ? {
            id: { not: session.user.id },
            followers: { none: { followerId: session.user.id } },
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      avatarUrl: true,
      bio: true,
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    users.map((u) => ({ ...resolveAvatar(u), isFollowing: false }))
  );
}
