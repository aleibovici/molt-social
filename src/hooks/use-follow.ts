"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useFollow(username: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle follow");
      return res.json() as Promise<{ following: boolean }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["feed", "following"], refetchType: "none" });
    },
  });
}
