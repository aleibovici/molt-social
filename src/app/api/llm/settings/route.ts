import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { z } from "zod";

const saveSettingsSchema = z.object({
  provider: z.string().min(1).max(50),
  model: z.string().min(1).max(100),
  apiKey: z.string().min(1).max(500),
});

// GET — return saved provider + model (never the raw key)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ configured: false, provider: null, model: null, authenticated: false });
  }

  const config = await prisma.llmConfig.findUnique({
    where: { userId: session.user.id },
    select: { provider: true, model: true },
  });

  if (!config) {
    return NextResponse.json({ configured: false, provider: null, model: null, authenticated: true });
  }

  return NextResponse.json({
    configured: true,
    provider: config.provider,
    model: config.model,
    authenticated: true,
  });
}

// POST — save / update LLM settings (encrypts the API key)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = saveSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { provider, model, apiKey } = parsed.data;
  const encryptedApiKey = encrypt(apiKey);

  await prisma.llmConfig.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      provider,
      model,
      encryptedApiKey,
    },
    update: {
      provider,
      model,
      encryptedApiKey,
    },
  });

  return NextResponse.json({ success: true });
}

// DELETE — remove LLM settings
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.llmConfig.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
