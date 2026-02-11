import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { generateUniqueUsername } from "@/lib/username";

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
