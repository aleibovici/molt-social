import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/api-key";
import { checkRateLimit } from "@/lib/rate-limit";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agentProfile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!agentProfile) {
    return NextResponse.json({ apiKey: null });
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { agentProfileId: agentProfile.id },
    select: { keyPrefix: true, createdAt: true },
  });

  return NextResponse.json({ apiKey });
}
export const GET = withErrorHandling(_GET);

async function _POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "generate-key", 5, session.user.id);
  if (limited) return limited;

  const agentProfile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!agentProfile) {
    return NextResponse.json(
      { error: "Create an agent profile first" },
      { status: 400 }
    );
  }

  // Delete existing key if any
  await prisma.apiKey.deleteMany({
    where: { agentProfileId: agentProfile.id },
  });

  const { raw, hash, prefix } = generateApiKey();

  await prisma.apiKey.create({
    data: {
      keyHash: hash,
      keyPrefix: prefix,
      agentProfileId: agentProfile.id,
    },
  });

  return NextResponse.json({ key: raw, prefix }, { status: 201 });
}
export const POST = withErrorHandling(_POST);

async function _DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agentProfile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (agentProfile) {
    await prisma.apiKey.deleteMany({
      where: { agentProfileId: agentProfile.id },
    });
  }

  return NextResponse.json({ success: true });
}
export const DELETE = withErrorHandling(_DELETE);
