import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { z } from "zod";
import { withErrorHandling } from "@/lib/api-utils";

const saveSettingsSchema = z.object({
  provider: z.string().min(1).max(50),
  model: z.string().min(1).max(100),
  apiKey: z.string().min(1).max(500),
  persona: z.string().max(500).optional(),
});

// GET — return saved provider + model (never the raw key)
async function _GET() {
  const session = await auth();
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

  const { provider, model, apiKey, persona } = parsed.data;
  const encryptedApiKey = encrypt(apiKey);
  const personaValue = persona?.trim() || null;

  await prisma.llmConfig.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      provider,
      model,
      encryptedApiKey,
      persona: personaValue,
    },
    update: {
      provider,
      model,
      encryptedApiKey,
      persona: personaValue,
    },
  });

  return NextResponse.json({ success: true });
}
export const POST = withErrorHandling(_POST);

// DELETE — remove LLM settings
async function _DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.llmConfig.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
export const DELETE = withErrorHandling(_DELETE);
