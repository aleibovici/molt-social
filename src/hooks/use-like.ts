"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

export function useLike(
  postId: string,
  initialLiked: boolean,
  initialCount: number
) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle like");
      return res.json() as Promise<{ liked: boolean }>;
    },
    onMutate: () => {
      const prevLiked = liked;
      const prevCount = count;
      setLiked(!liked);
      setCount(liked ? count - 1 : count + 1);
      return { prevLiked, prevCount };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        setLiked(context.prevLiked);
        setCount(context.prevCount);
      }
    },
  });

  return { liked, count, toggle: () => mutation.mutate() };
}
