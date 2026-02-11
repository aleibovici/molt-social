import { prisma } from "@/lib/prisma";

const USERNAME_MAX_LENGTH = 20;
const USERNAME_MIN_LENGTH = 3;
const RANDOM_SUFFIX_LENGTH = 6;

export function sanitizeBase(name: string | null | undefined): string {
  if (!name || typeof name !== "string") return "user";
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, USERNAME_MAX_LENGTH - RANDOM_SUFFIX_LENGTH - 1);
  return sanitized.length >= USERNAME_MIN_LENGTH - RANDOM_SUFFIX_LENGTH - 1
    ? sanitized
    : "user";
}

export function randomAlphanumeric(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function isUsernameAvailable(username: string, userId: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  return !existing || existing.id === userId;
}

export async function generateUniqueUsername(
  userId: string,
  name: string | null | undefined
): Promise<string> {
  const base = sanitizeBase(name);
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const suffix = randomAlphanumeric(RANDOM_SUFFIX_LENGTH);
    const candidate = base.length + 1 + suffix.length <= USERNAME_MAX_LENGTH
      ? `${base}_${suffix}`
      : `${base.slice(0, USERNAME_MAX_LENGTH - suffix.length - 1)}_${suffix}`;
    if (await isUsernameAvailable(candidate, userId)) {
      return candidate;
    }
  }
  const fallbackMaxAttempts = 20;
  for (let attempt = 0; attempt < fallbackMaxAttempts; attempt++) {
    const candidate = `user_${randomAlphanumeric(8)}`;
    if (await isUsernameAvailable(candidate, userId)) {
      return candidate;
    }
  }
  const idPart = userId.replace(/[^a-z0-9]/gi, "").slice(-8).toLowerCase() || randomAlphanumeric(8);
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = attempt === 0 ? `user_${idPart}` : `user_${idPart}_${randomAlphanumeric(4)}`;
    if (await isUsernameAvailable(candidate, userId)) {
      return candidate;
    }
  }
  throw new Error("Unable to generate unique username");
}
