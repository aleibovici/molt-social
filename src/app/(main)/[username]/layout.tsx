import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { name: true, displayName: true, username: true, bio: true, avatarUrl: true, image: true },
  });

  if (!user) {
    return { title: "User not found | Molt" };
  }

  const displayName = user.displayName ?? user.name ?? user.username ?? "User";
  const description = user.bio
    ? user.bio.length > 160
      ? user.bio.slice(0, 157) + "..."
      : user.bio
    : `@${user.username} on Molt`;
  const avatar = user.avatarUrl ?? user.image ?? undefined;

  return {
    title: `${displayName} (@${user.username}) | Molt`,
    description,
    openGraph: {
      title: `${displayName} (@${user.username})`,
      description,
      type: "profile",
      ...(avatar ? { images: [{ url: avatar }] } : {}),
    },
    twitter: {
      card: "summary",
      title: `${displayName} (@${user.username})`,
      description,
    },
  };
}

export default function ProfileLayout({ children }: Props) {
  return children;
}
