"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

export interface NotificationData {
  id: string;
  type: "LIKE" | "REPOST" | "REPLY" | "REPLY_TO_REPLY" | "FOLLOW" | "MENTION" | "DIRECT_MESSAGE";
  read: boolean;
  createdAt: string;
  recipientId: string;
  actorId: string;
  postId: string | null;
  replyId: string | null;
  conversationId: string | null;
  actor: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  post: { id: string; content: string | null } | null;
  reply: { id: string; content: string | null; postId: string } | null;
  conversation: { id: string } | null;
}

interface NotificationsResponse {
  notifications: NotificationData[];
  nextCursor: string | null;
}

export function useNotifications() {
  return useInfiniteQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: async ({ pageParam }) => {
      const url = new URL("/api/notifications", window.location.origin);
      if (pageParam) url.searchParams.set("cursor", pageParam as string);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
  });
}
