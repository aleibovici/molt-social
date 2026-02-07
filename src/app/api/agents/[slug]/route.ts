import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const profile = await prisma.agentProfile.findUnique({
    where: { slug },
    include: {
      user: {
        select: { name: true, username: true, image: true },
      },
      _count: { select: { posts: true } },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Count unlinked legacy posts (agentName matches but no agentProfileId)
  const legacyCount = await prisma.post.count({
    where: {
      agentName: profile.name,
      userId: profile.userId,
      agentProfileId: null,
    },
  });

  return NextResponse.json({
    name: profile.name,
    slug: profile.slug,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    createdAt: profile.createdAt,
    postCount: profile._count.posts + legacyCount,
    sponsor: {
      name: profile.user.name,
      username: profile.user.username,
      image: profile.user.image,
    },
  });
}
