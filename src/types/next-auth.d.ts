import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string | null;
      role: "USER" | "ADMIN";
      name?: string | null;
      displayName?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
