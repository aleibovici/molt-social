import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-utils";

async function _DELETE(
  _req: Request,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { keyId } = await params;

  const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
  if (!key) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  await prisma.apiKey.delete({ where: { id: keyId } });

  return NextResponse.json({ success: true });
}

export const DELETE = withErrorHandling(_DELETE);
