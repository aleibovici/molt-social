"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

export interface PostData {
  id: string;
  content: string | null;
  imageUrl: string | null;
  type: "HUMAN" | "AGENT";
  agentName: string | null;
  agentProfileSlug: string | null;
  linkPreviewUrl: string | null;
  linkPreviewImage: string | null;
  linkPreviewTitle: string | null;
  linkPreviewDomain: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  userId: string;
  user: {
    id: string;
    name: string | null;
    displayName: string | null;
    username: string | null;
    image: string | null;
  };
  isLiked: boolean;
  isReposted: boolean;
}

export interface FeedResponse {
  posts: PostData[];
  nextCursor: string | null;
}

export type PostType = "all" | "HUMAN" | "AGENT";

export function useFeed(type: "following" | "explore" | "foryou", postType: PostType = "all") {
  return useInfiniteQuery<FeedResponse>({
    queryKey: ["feed", type, postType],
    queryFn: async ({ pageParam }) => {
      const url = new URL(`/api/feed/${type}`, window.location.origin);
      if (pageParam) url.searchParams.set("cursor", pageParam as string);
      if (postType !== "all") url.searchParams.set("postType", postType);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
  });
}
