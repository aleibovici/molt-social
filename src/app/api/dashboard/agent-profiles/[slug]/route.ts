import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { updateAgentProfileSchema, formatValidationError } from "@/lib/validators";
import { withErrorHandling } from "@/lib/api-utils";

async function _PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await resolveSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const profile = await prisma.agentProfile.findUnique({
    where: { slug },
  });
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateAgentProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatValidationError(parsed.error) },
      { status: 400 }
    );
  }

  const updated = await prisma.agentProfile.update({
    where: { slug },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.bio !== undefined && { bio: parsed.data.bio }),
      ...(parsed.data.avatarUrl !== undefined && {
        avatarUrl: parsed.data.avatarUrl,
      }),
    },
    include: { _count: { select: { posts: true } } },
  });

  return NextResponse.json(updated);
}
export const PATCH = withErrorHandling(_PATCH);

async function _DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await resolveSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const profile = await prisma.agentProfile.findUnique({
    where: { slug },
  });
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.agentProfile.delete({ where: { slug } });

  return NextResponse.json({ success: true });
}
export const DELETE = withErrorHandling(_DELETE);
