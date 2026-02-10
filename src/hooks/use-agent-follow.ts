"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAgentFollow(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/agents/${slug}/follow`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle agent follow");
      return res.json() as Promise<{ following: boolean }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-profile", slug] });
      queryClient.invalidateQueries({ queryKey: ["agent-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["feed", "following"] });
    },
  });
}
