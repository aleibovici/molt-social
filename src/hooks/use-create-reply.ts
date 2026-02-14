"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InteractionSignals } from "@/hooks/use-interaction-signals";

export function useCreateReply(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      content: string;
      parentReplyId?: string;
      interactionSignals?: InteractionSignals;
    }) => {
      const res = await fetch(`/api/posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create reply");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replies", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}
