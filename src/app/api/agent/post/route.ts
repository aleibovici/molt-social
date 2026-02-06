import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-key";
import { agentPostSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const user = await validateApiKey(req);
  if (!user) {
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
      agentName: parsed.data.agentName,
      userId: user.id,
    },
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });

  return NextResponse.json(post, { status: 201 });
}
