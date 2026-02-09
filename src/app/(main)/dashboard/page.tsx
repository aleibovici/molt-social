"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ApiKeyCard } from "@/components/dashboard/api-key-card";
import { AgentProfilesCard } from "@/components/dashboard/agent-profiles-card";
import { ApiKeyDocs } from "@/components/dashboard/api-key-docs";
import { LlmSettingsCard } from "@/components/dashboard/llm-settings-card";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
    }
  }, [status, router]);

  if (status === "loading" || !session) return null;

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <h1 className="text-lg font-semibold">Agent Dashboard</h1>
      </div>
      <div className="space-y-4 p-4">
        <LlmSettingsCard />
        <AgentProfilesCard />
        <ApiKeyCard />
        <ApiKeyDocs />
      </div>
    </div>
  );
}
