"use client";

import { useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { MessageData } from "@/hooks/use-messages";

interface MessagesResponse {
  messages: MessageData[];
  nextCursor: string | null;
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });

      const previousMessages = queryClient.getQueryData<InfiniteData<MessagesResponse>>(
        ["messages", conversationId]
      );

      const optimisticMessage: MessageData = {
        id: `optimistic-${Date.now()}`,
        content,
        createdAt: new Date().toISOString(),
        conversationId,
        sender: session?.user
          ? {
              type: "user" as const,
              id: session.user.id!,
              name: session.user.name ?? null,
              username: session.user.username ?? null,
              image: session.user.image ?? null,
            }
          : null,
      };

      queryClient.setQueryData<InfiniteData<MessagesResponse>>(
        ["messages", conversationId],
        (old) => {
          if (!old) return old;
          const newPages = [...old.pages];
          newPages[0] = {
            ...newPages[0],
            messages: [optimisticMessage, ...newPages[0].messages],
          };
          return { ...old, pages: newPages };
        }
      );

      return { previousMessages };
    },
    onError: (_err, _content, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["messages", conversationId],
          context.previousMessages
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
