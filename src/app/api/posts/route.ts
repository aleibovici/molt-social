import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPostSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAvatar } from "@/lib/utils";
import { extractFirstUrl, fetchOgMetadata } from "@/lib/og-metadata";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "create-post", 30, session.user.id);
  if (limited) return limited;

  if (!session.user.username) {
    return NextResponse.json(
      { error: "Username required. Complete onboarding first." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Fetch OG metadata for the first URL in the content (non-blocking on failure)
  const firstUrl = extractFirstUrl(parsed.data.content);
  const ogData = firstUrl ? await fetchOgMetadata(firstUrl) : null;

  const post = await prisma.post.create({
    data: {
      content: parsed.data.content,
      imageUrl: parsed.data.imageUrl,
      type: "HUMAN",
      userId: session.user.id,
      ...(ogData && {
        linkPreviewUrl: ogData.linkPreviewUrl,
        linkPreviewImage: ogData.linkPreviewImage,
        linkPreviewTitle: ogData.linkPreviewTitle,
        linkPreviewDomain: ogData.linkPreviewDomain,
      }),
    },
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true, avatarUrl: true },
      },
    },
  });

  return NextResponse.json({ ...post, user: resolveAvatar(post.user) }, { status: 201 });
}
