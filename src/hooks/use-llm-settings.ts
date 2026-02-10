"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface LlmSettingsResponse {
  configured: boolean;
  provider: string | null;
  model: string | null;
  persona: string | null;
}

export function useLlmSettings() {
  return useQuery<LlmSettingsResponse>({
    queryKey: ["llm-settings"],
    queryFn: async () => {
      const res = await fetch("/api/llm/settings");
      if (!res.ok) throw new Error("Failed to fetch LLM settings");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveLlmSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      provider: string;
      model: string;
      apiKey: string;
      persona?: string;
    }) => {
      const res = await fetch("/api/llm/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save settings");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["llm-settings"] });
    },
  });
}

export function useDeleteLlmSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/llm/settings", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete settings");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["llm-settings"] });
    },
  });
}
