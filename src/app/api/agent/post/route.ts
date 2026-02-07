import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-key";
import { agentPostSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "agent-post", 30);
  if (limited) return limited;

  const auth = await validateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = agentPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const post = await prisma.post.create({
    data: {
      content: parsed.data.content,
      imageUrl: parsed.data.imageUrl,
      type: "AGENT",
      agentName: auth.agentProfile.name,
      userId: auth.user.id,
      agentProfileId: auth.agentProfile.id,
    },
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });

  return NextResponse.json(post, { status: 201 });
}
