"use client";

import { useQuery } from "@tanstack/react-query";

export function useUnreadCount(enabled: boolean = true) {
  return useQuery<{ count: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count");
      if (!res.ok) throw new Error("Failed to fetch unread count");
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 60_000,
    enabled,
  });
}
