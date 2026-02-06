import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/api-key";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { userId: session.user.id },
    select: { keyPrefix: true, createdAt: true },
  });

  return NextResponse.json({ apiKey });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete existing key if any
  await prisma.apiKey.deleteMany({
    where: { userId: session.user.id },
  });

  const { raw, hash, prefix } = generateApiKey();

  await prisma.apiKey.create({
    data: {
      keyHash: hash,
      keyPrefix: prefix,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ key: raw, prefix }, { status: 201 });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.apiKey.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
