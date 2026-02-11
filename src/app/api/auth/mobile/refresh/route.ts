import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMobileToken } from "@/lib/mobile-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { withErrorHandling } from "@/lib/api-utils";

const MOBILE_SESSION_DURATION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

async function _POST(req: Request) {
  const limited = checkRateLimit(req, "mobile-token-refresh", 10);
  if (limited) return limited;

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer mol_")) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const oldToken = authHeader.slice(7);

  const existing = await prisma.session.findUnique({
    where: { sessionToken: oldToken },
    include: { user: true },
  });

  if (!existing || existing.expires <= new Date()) {
    return NextResponse.json({ error: "Session expired or invalid" }, { status: 401 });
  }

  // Rotate: delete old session, create new one
  const newToken = generateMobileToken();
  const newExpires = new Date(Date.now() + MOBILE_SESSION_DURATION_MS);

  await prisma.$transaction([
    prisma.session.delete({ where: { id: existing.id } }),
    prisma.session.create({
      data: {
        sessionToken: newToken,
        userId: existing.userId,
        expires: newExpires,
      },
    }),
  ]);

  const user = existing.user;

  return NextResponse.json({
    sessionToken: newToken,
    expiresAt: newExpires.toISOString(),
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      name: user.name,
      image: user.avatarUrl ?? user.image,
      role: user.role,
    },
  });
}
export const POST = withErrorHandling(_POST);
