"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

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
      return res.json();
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}
