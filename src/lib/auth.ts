import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const USERNAME_MAX_LENGTH = 20;
const USERNAME_MIN_LENGTH = 3;
const RANDOM_SUFFIX_LENGTH = 6;

function sanitizeBase(name: string | null | undefined): string {
  if (!name || typeof name !== "string") return "user";
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, USERNAME_MAX_LENGTH - RANDOM_SUFFIX_LENGTH - 1); // leave room for _xxxxxx
  return sanitized.length >= USERNAME_MIN_LENGTH - RANDOM_SUFFIX_LENGTH - 1
    ? sanitized
    : "user";
}

function randomAlphanumeric(length: number): string {
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

async function generateUniqueUsername(
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
  // Fallback: user_<random> — keep trying until we find a unique one
  const fallbackMaxAttempts = 20;
  for (let attempt = 0; attempt < fallbackMaxAttempts; attempt++) {
    const candidate = `user_${randomAlphanumeric(8)}`;
    if (await isUsernameAvailable(candidate, userId)) {
      return candidate;
    }
  }
  // Last resort: include part of userId (cuid is alphanumeric) so no other user can have it
  const idPart = userId.replace(/[^a-z0-9]/gi, "").slice(-8).toLowerCase() || randomAlphanumeric(8);
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = attempt === 0 ? `user_${idPart}` : `user_${idPart}_${randomAlphanumeric(4)}`;
    if (await isUsernameAvailable(candidate, userId)) {
      return candidate;
    }
  }
  throw new Error("Unable to generate unique username");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [Google({}), GitHub({})],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // The PrismaAdapter already loads the full User record via `include: { user: true }`
        // so we can read custom fields directly instead of a redundant DB query.
        const dbUser = user as typeof user & {
          username: string | null;
          displayName: string | null;
          role: "USER" | "ADMIN";
          avatarUrl: string | null;
        };
        try {
          let username = dbUser.username;
          if (username === null) {
            const generated = await generateUniqueUsername(user.id, dbUser.name);
            try {
              await prisma.user.update({
                where: { id: user.id },
                data: { username: generated },
              });
              username = generated;
            } catch (e: unknown) {
              if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
                const updated = await prisma.user.findUnique({
                  where: { id: user.id },
                  select: { username: true },
                });
                username = updated?.username ?? generated;
              } else {
                throw e;
              }
            }
          }
          session.user.username = username;
          session.user.role = dbUser.role ?? "USER";
          session.user.displayName = dbUser.displayName ?? null;
          if (dbUser.name) {
            session.user.name = dbUser.name;
          }
          session.user.image = dbUser.avatarUrl ?? dbUser.image ?? session.user.image;
        } catch {
          session.user.username = null;
          session.user.role = "USER";
        }
      }
      return session;
    },
  },
});
