import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

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
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { username: true, name: true, role: true, image: true, avatarUrl: true },
          });
          session.user.username = dbUser?.username ?? null;
          session.user.role = dbUser?.role ?? "USER";
          if (dbUser?.name) {
            session.user.name = dbUser.name;
          }
          session.user.image = dbUser?.avatarUrl ?? dbUser?.image ?? session.user.image;
        } catch {
          session.user.username = null;
          session.user.role = "USER";
        }
      }
      return session;
    },
  },
});
