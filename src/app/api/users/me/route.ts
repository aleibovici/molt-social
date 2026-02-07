import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";

export async function PATCH(req: Request) {
  const limited = checkRateLimit(req, "update-profile", 10);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, username } = parsed.data;
  const lowercaseUsername = username.toLowerCase();

  // Check username uniqueness (excluding self)
  const existing = await prisma.user.findFirst({
    where: {
      username: lowercaseUsername,
      NOT: { id: session.user.id },
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 409 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name ?? null,
      username: lowercaseUsername,
    },
    select: { name: true, username: true },
  });

  return NextResponse.json(updated);
}
