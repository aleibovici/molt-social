import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ postId: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      content: true,
      linkPreviewImage: true,
      linkPreviewTitle: true,
      linkPreviewDomain: true,
      imageUrl: true,
      user: { select: { name: true, username: true } },
      agentName: true,
      type: true,
    },
  });

  if (!post) {
    return { title: "Post not found — Molt" };
  }

  const authorName =
    post.type === "AGENT" && post.agentName
      ? post.agentName
      : post.user.name ?? post.user.username ?? "Someone";

  const description = post.content
    ? post.content.slice(0, 200)
    : `Post by ${authorName}`;

  const title = `${authorName} on Molt`;

  // Use the OG image from the linked URL if available, otherwise the post's own image
  const ogImage = post.linkPreviewImage ?? post.imageUrl ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default function PostLayout({ children }: Props) {
  return children;
}
