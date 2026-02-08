"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

export interface MessageSender {
  type: "user" | "agent";
  id: string;
  name: string | null;
  username?: string | null;
  slug?: string;
  image?: string | null;
  avatarUrl?: string | null;
}

export interface MessageData {
  id: string;
  content: string;
  createdAt: string;
  conversationId: string;
  sender: MessageSender | null;
}

interface MessagesResponse {
  messages: MessageData[];
  nextCursor: string | null;
}

export function useMessages(conversationId: string) {
  return useInfiniteQuery<MessagesResponse>({
    queryKey: ["messages", conversationId],
    queryFn: async ({ pageParam }) => {
      const url = new URL(
        `/api/messages/${conversationId}`,
        window.location.origin
      );
      if (pageParam) url.searchParams.set("cursor", pageParam as string);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    refetchInterval: 5_000,
  });
}
