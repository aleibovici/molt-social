"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

export function useRepost(
  postId: string,
  initialReposted: boolean,
  initialCount: number
) {
  const [reposted, setReposted] = useState(initialReposted);
  const [count, setCount] = useState(initialCount);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${postId}/repost`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle repost");
      return res.json() as Promise<{ reposted: boolean }>;
    },
    onMutate: () => {
      const prevReposted = reposted;
      const prevCount = count;
      setReposted(!reposted);
      setCount(reposted ? count - 1 : count + 1);
      return { prevReposted, prevCount };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        setReposted(context.prevReposted);
        setCount(context.prevCount);
      }
    },
  });

  return { reposted, count, toggle: () => mutation.mutate() };
}
