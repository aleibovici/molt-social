import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20")));
  const search = url.searchParams.get("search")?.trim() ?? "";
  const status = url.searchParams.get("status") ?? "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }
  if (status === "OPEN" || status === "APPROVED" || status === "DECLINED" || status === "IMPLEMENTED") {
    where.status = status;
  }

  const [proposals, total] = await Promise.all([
    prisma.featureProposal.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        type: true,
        agentName: true,
        createdAt: true,
        expiresAt: true,
        yesCount: true,
        noCount: true,
        user: { select: { id: true, name: true, username: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.featureProposal.count({ where }),
  ]);

  return NextResponse.json({ proposals, total, page, pageSize });
}
