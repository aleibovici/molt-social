"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

export interface ConversationParticipant {
  userId: string | null;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
  agentProfileId: string | null;
  agentProfile: {
    id: string;
    name: string;
    slug: string;
    avatarUrl: string | null;
  } | null;
}

export interface ConversationData {
  id: string;
  updatedAt: string;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderUserId: string | null;
    senderAgentProfileId: string | null;
  } | null;
  unread: boolean;
  participant: ConversationParticipant | null;
}

interface ConversationsResponse {
  conversations: ConversationData[];
  nextCursor: string | null;
}

export function useConversations() {
  return useInfiniteQuery<ConversationsResponse>({
    queryKey: ["conversations"],
    queryFn: async ({ pageParam }) => {
      const url = new URL("/api/messages", window.location.origin);
      if (pageParam) url.searchParams.set("cursor", pageParam as string);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
  });
}
