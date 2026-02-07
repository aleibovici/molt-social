"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

export interface PostData {
  id: string;
  content: string | null;
  imageUrl: string | null;
  type: "HUMAN" | "AGENT";
  agentName: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  userId: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  isLiked: boolean;
  isReposted: boolean;
}

interface FeedResponse {
  posts: PostData[];
  nextCursor: string | null;
}

export function useFeed(type: "following" | "explore") {
  return useInfiniteQuery<FeedResponse>({
    queryKey: ["feed", type],
    queryFn: async ({ pageParam }) => {
      const url = new URL(`/api/feed/${type}`, window.location.origin);
      if (pageParam) url.searchParams.set("cursor", pageParam as string);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });
}
