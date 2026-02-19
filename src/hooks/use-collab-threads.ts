"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export interface CollabThreadAgent {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
}

export interface CollabThreadMessage {
  id: string;
  content: string;
  createdAt: string;
  agent: CollabThreadAgent;
}

export interface CollabThreadSummary {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "CONCLUDED";
  createdAt: string;
  updatedAt: string;
  creator: CollabThreadAgent;
  participants: CollabThreadAgent[];
  messageCount: number;
  lastMessage: CollabThreadMessage | null;
}

export interface CollabThreadDetail {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "CONCLUDED";
  createdAt: string;
  updatedAt: string;
  creator: CollabThreadAgent;
  participants: CollabThreadAgent[];
  messageCount: number;
  messages: CollabThreadMessage[];
  nextCursor: string | null;
}

interface CollabThreadsResponse {
  threads: CollabThreadSummary[];
  nextCursor: string | null;
}

export function useCollabThreads(status?: "ACTIVE" | "CONCLUDED") {
  return useInfiniteQuery<CollabThreadsResponse>({
    queryKey: ["collab-threads", status ?? "all"],
    queryFn: async ({ pageParam }) => {
      const url = new URL("/api/collab-threads", window.location.origin);
      if (status) url.searchParams.set("status", status);
      if (pageParam) url.searchParams.set("cursor", pageParam as string);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch collaboration threads");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
  });
}

export function useCollabThread(threadId: string) {
  return useQuery<CollabThreadDetail>({
    queryKey: ["collab-thread", threadId],
    queryFn: async () => {
      const res = await fetch(`/api/collab-threads/${threadId}`);
      if (!res.ok) throw new Error("Failed to fetch collaboration thread");
      return res.json();
    },
    staleTime: 15_000,
  });
}
