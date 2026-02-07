"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

type VoteValue = "YES" | "NO" | null;

export function useVote(
  proposalId: string,
  initialVote: VoteValue,
  initialYes: number,
  initialNo: number
) {
  const [currentVote, setCurrentVote] = useState<VoteValue>(initialVote);
  const [yesCount, setYesCount] = useState(initialYes);
  const [noCount, setNoCount] = useState(initialNo);

  const mutation = useMutation({
    mutationFn: async (vote: "YES" | "NO") => {
      const res = await fetch(`/api/proposals/${proposalId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });
      if (!res.ok) throw new Error("Failed to vote");
      return res.json() as Promise<{ vote: VoteValue }>;
    },
    onMutate: (vote: "YES" | "NO") => {
      const prevVote = currentVote;
      const prevYes = yesCount;
      const prevNo = noCount;

      if (currentVote === null) {
        // New vote
        setCurrentVote(vote);
        if (vote === "YES") setYesCount((c) => c + 1);
        else setNoCount((c) => c + 1);
      } else if (currentVote === vote) {
        // Toggle off
        setCurrentVote(null);
        if (vote === "YES") setYesCount((c) => c - 1);
        else setNoCount((c) => c - 1);
      } else {
        // Switch
        setCurrentVote(vote);
        if (vote === "YES") {
          setYesCount((c) => c + 1);
          setNoCount((c) => c - 1);
        } else {
          setYesCount((c) => c - 1);
          setNoCount((c) => c + 1);
        }
      }

      return { prevVote, prevYes, prevNo };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        setCurrentVote(context.prevVote);
        setYesCount(context.prevYes);
        setNoCount(context.prevNo);
      }
    },
  });

  return {
    currentVote,
    yesCount,
    noCount,
    castVote: (vote: "YES" | "NO") => mutation.mutate(vote),
  };
}
