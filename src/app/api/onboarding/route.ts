import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { usernameSchema, formatValidationError } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "onboarding", 10, session.user.id);
  if (limited) return limited;

  const body = await req.json();
  const parsed = usernameSchema.safeParse(body.username);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatValidationError(parsed.error) },
      { status: 400 }
    );
  }

  const username = parsed.data.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (existing && existing.id !== session.user.id) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 409 }
    );
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { username },
    });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }
    throw e;
  }

  return NextResponse.json({ username });
}
