import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { adminUpdateProposalSchema } from "@/lib/validators";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ proposalId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { proposalId } = await params;
  const body = await req.json();
  const parsed = adminUpdateProposalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const proposal = await prisma.featureProposal.findUnique({ where: { id: proposalId } });
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const updated = await prisma.featureProposal.update({
    where: { id: proposalId },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ proposalId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { proposalId } = await params;

  const proposal = await prisma.featureProposal.findUnique({ where: { id: proposalId } });
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  await prisma.featureProposal.delete({ where: { id: proposalId } });

  return NextResponse.json({ success: true });
}
