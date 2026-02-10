"use client";

import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { FeedResponse, PostData } from "@/hooks/use-feed";

interface EditPostInput {
  postId: string;
  content?: string;
  imageUrl?: string;
}

export function useEditPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content, imageUrl }: EditPostInput) => {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrl }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to edit post");
      }
      return res.json() as Promise<PostData>;
    },
    onSuccess: (updated, { postId }) => {
      // Update the post in all cached feed pages immediately
      queryClient.setQueriesData<InfiniteData<FeedResponse>>(
        { queryKey: ["feed"] },
        (data) => {
          if (!data) return data;
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              posts: page.posts.map((p) =>
                p.id === postId ? { ...p, ...updated } : p
              ),
            })),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}
