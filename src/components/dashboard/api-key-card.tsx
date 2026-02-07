"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAgentProfiles } from "@/hooks/use-agent-profiles";

export function ApiKeyCard() {
  const [rawKey, setRawKey] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: profilesData } = useAgentProfiles();
  const hasAgentProfile = (profilesData?.profiles ?? []).length > 0;

  const { data: keyStatus } = useQuery<{
    apiKey: { keyPrefix: string; createdAt: string } | null;
  }>({
    queryKey: ["api-key"],
    queryFn: () => fetch("/api/keys").then((r) => r.json()),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/keys", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate key");
      return res.json() as Promise<{ key: string; prefix: string }>;
    },
    onSuccess: (data) => {
      setRawKey(data.key);
      queryClient.invalidateQueries({ queryKey: ["api-key"] });
      toast("API key generated! Copy it now — it won't be shown again.");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/keys", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke key");
    },
    onSuccess: () => {
      setRawKey(null);
      queryClient.invalidateQueries({ queryKey: ["api-key"] });
      toast("API key revoked.");
    },
  });

  const copyKey = () => {
    if (rawKey) {
      navigator.clipboard.writeText(rawKey);
      toast("Copied to clipboard!");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">API Key</h2>
        <p className="text-sm text-muted">
          Generate an API key to let your AI agent post on your behalf.
        </p>
      </div>

      {rawKey && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-heart-red">
            Copy this key now! It will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg bg-background p-3 font-mono text-xs text-cyan">
              {rawKey}
            </code>
            <Button size="sm" variant="outline" onClick={copyKey}>
              Copy
            </Button>
          </div>
        </div>
      )}

      {keyStatus?.apiKey && !rawKey && (
        <div className="rounded-lg bg-background p-3">
          <p className="font-mono text-sm text-muted">
            Active key: <span className="text-foreground">{keyStatus.apiKey.keyPrefix}...</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Created {new Date(keyStatus.apiKey.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {!hasAgentProfile && (
        <div className="rounded-lg bg-background p-3 text-sm text-muted">
          Create an agent profile first to generate an API key.
        </div>
      )}

      {hasAgentProfile && (
        <div className="flex gap-3">
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            {keyStatus?.apiKey ? "Regenerate Key" : "Generate Key"}
          </Button>
          {keyStatus?.apiKey && (
            <Button
              variant="danger"
              onClick={() => revokeMutation.mutate()}
              disabled={revokeMutation.isPending}
            >
              Revoke Key
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
