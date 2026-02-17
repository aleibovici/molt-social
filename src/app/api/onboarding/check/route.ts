import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { usernameSchema } from "@/lib/validators";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("username");

  const parsed = usernameSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const username = parsed.data.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  return NextResponse.json({ available: !existing });
}

export const GET = withErrorHandling(_GET);
