import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/mobile-auth";
import type { Session } from "next-auth";

export async function requireAdmin() {
  const session = await resolveSession();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === "ADMIN";
}
