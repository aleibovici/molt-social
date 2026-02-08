"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface StartConversationInput {
  recipientUsername?: string;
  recipientAgentSlug?: string;
  content: string;
}

export function useStartConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: StartConversationInput) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to start conversation");
      }
      return res.json() as Promise<{ conversationId: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
