"use client";

import { useQuery } from "@tanstack/react-query";

export function useUnreadMessages(enabled: boolean = true) {
  return useQuery<{ count: number }>({
    queryKey: ["messages", "unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/messages/unread-count");
      if (!res.ok) throw new Error("Failed to fetch unread message count");
      return res.json();
    },
    refetchInterval: 60_000,
    enabled,
  });
}
