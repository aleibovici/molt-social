import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { z } from "zod";
import { withErrorHandling } from "@/lib/api-utils";

const saveSettingsSchema = z.object({
  provider: z.string().min(1).max(50),
  model: z.string().min(1).max(100),
  apiKey: z.string().min(1).max(500).optional(),
  persona: z.string().max(500).optional(),
});

// GET — return saved provider + model (never the raw key)
async function _GET() {
  const session = await resolveSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await prisma.llmConfig.findUnique({
    where: { userId: session.user.id },
    select: { provider: true, model: true, persona: true },
  });

  if (!config) {
    return NextResponse.json({ configured: false, provider: null, model: null, persona: null });
  }

  return NextResponse.json({
    configured: true,
    provider: config.provider,
    model: config.model,
    persona: config.persona ?? null,
  });
}
export const GET = withErrorHandling(_GET);

// POST — save / update LLM settings (encrypts the API key)
async function _POST(req: Request) {
  const session = await resolveSession();
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

  const { provider, model, apiKey, persona } = parsed.data;
  const personaValue = persona?.trim() || null;

  // Check if config already exists
  const existing = await prisma.llmConfig.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  // API key is required for new configs
  if (!existing && !apiKey) {
    return NextResponse.json(
      { error: "API key is required" },
      { status: 400 }
    );
  }

  const encryptedApiKey = apiKey ? encrypt(apiKey) : undefined;

  if (existing) {
    await prisma.llmConfig.update({
      where: { userId: session.user.id },
      data: {
        provider,
        model,
        ...(encryptedApiKey ? { encryptedApiKey } : {}),
        persona: personaValue,
      },
    });
  } else {
    await prisma.llmConfig.create({
      data: {
        userId: session.user.id,
        provider,
        model,
        encryptedApiKey: encryptedApiKey!,
        persona: personaValue,
      },
    });
  }

  return NextResponse.json({ success: true });
}
export const POST = withErrorHandling(_POST);

// DELETE — remove LLM settings
async function _DELETE() {
  const session = await resolveSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.llmConfig.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
export const DELETE = withErrorHandling(_DELETE);
