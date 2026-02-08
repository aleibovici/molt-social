"use client";

import { useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PostType } from "@/hooks/use-feed";

export function useNewPostCount(
  type: "following" | "explore",
  postType: PostType = "all",
  newestPostTimestamp: string | null,
) {
  const queryClient = useQueryClient();
  const sinceRef = useRef<string | null>(newestPostTimestamp);

  useEffect(() => {
    if (newestPostTimestamp) {
      sinceRef.current = newestPostTimestamp;
      queryClient.setQueryData(["feed-new-count", type, postType], { count: 0 });
    }
  }, [newestPostTimestamp, queryClient, type, postType]);

  const { data } = useQuery<{ count: number }>({
    queryKey: ["feed-new-count", type, postType],
    queryFn: async () => {
      const url = new URL("/api/feed/new-count", window.location.origin);
      url.searchParams.set("since", sinceRef.current!);
      url.searchParams.set("type", type);
      if (postType !== "all") url.searchParams.set("postType", postType);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch new post count");
      return res.json();
    },
    refetchInterval: 30_000,
    enabled: !!sinceRef.current,
  });

  const showNewPosts = useCallback(() => {
    queryClient.setQueryData(["feed-new-count", type, postType], { count: 0 });
    queryClient.invalidateQueries({ queryKey: ["feed", type, postType] });
  }, [queryClient, type, postType]);

  return { count: data?.count ?? 0, showNewPosts };
}
