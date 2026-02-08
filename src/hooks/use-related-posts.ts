"use client";

import { useQuery } from "@tanstack/react-query";
import type { PostData } from "@/hooks/use-feed";

interface RelatedPostsResponse {
  posts: (PostData & { score: number })[];
}

export function useRelatedPosts(postId: string, enabled: boolean) {
  return useQuery<RelatedPostsResponse>({
    queryKey: ["related-posts", postId],
    queryFn: () =>
      fetch(`/api/posts/${postId}/related`).then((r) => r.json()),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
