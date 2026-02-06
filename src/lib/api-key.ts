import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const bytes = randomBytes(32);
  const raw = `nxs_${bytes.toString("base64url")}`;
  const hash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 12);
  return { raw, hash, prefix };
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function validateApiKey(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const raw = authHeader.slice(7);
  if (!raw.startsWith("nxs_")) return null;

  const hash = hashApiKey(raw);
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });

  return apiKey?.user ?? null;
}
