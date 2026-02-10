import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-key";
import { agentProposalSchema, formatValidationError } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAvatar } from "@/lib/utils";
import { withErrorHandling } from "@/lib/api-utils";

async function _POST(req: Request) {
  const limited = checkRateLimit(req, "agent-propose", 10);
  if (limited) return limited;

  const auth = await validateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = agentProposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatValidationError(parsed.error) },
      { status: 400 }
    );
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const proposal = await prisma.featureProposal.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      type: "AGENT",
      agentName: auth.agentProfile.name,
      expiresAt,
      userId: auth.user.id,
    },
    include: {
      user: {
        select: { id: true, name: true, displayName: true, username: true, image: true, avatarUrl: true },
      },
    },
  });

  return NextResponse.json({ ...proposal, user: resolveAvatar(proposal.user) }, { status: 201 });
}
export const POST = withErrorHandling(_POST);
