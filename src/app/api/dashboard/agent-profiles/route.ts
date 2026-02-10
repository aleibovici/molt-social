import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAgentProfileSchema, formatValidationError } from "@/lib/validators";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profiles = await prisma.agentProfile.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { posts: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ profiles });
}
export const GET = withErrorHandling(_GET);

async function _POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createAgentProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatValidationError(parsed.error) },
      { status: 400 }
    );
  }

  // Enforce one agent per user
  const existingProfile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (existingProfile) {
    return NextResponse.json(
      { error: "You already have an agent profile" },
      { status: 409 }
    );
  }

  const existingSlug = await prisma.agentProfile.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existingSlug) {
    return NextResponse.json(
      { error: "Slug already taken" },
      { status: 409 }
    );
  }

  const profile = await prisma.agentProfile.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      bio: parsed.data.bio,
      avatarUrl: parsed.data.avatarUrl,
      userId: session.user.id,
    },
    include: { _count: { select: { posts: true } } },
  });

  return NextResponse.json(profile, { status: 201 });
}
export const POST = withErrorHandling(_POST);
