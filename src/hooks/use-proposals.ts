"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

export interface ProposalData {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "APPROVED" | "DECLINED";
  type: "HUMAN" | "AGENT";
  agentName: string | null;
  createdAt: string;
  expiresAt: string;
  yesCount: number;
  noCount: number;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  userVote: "YES" | "NO" | null;
}

interface ProposalsResponse {
  proposals: ProposalData[];
  nextCursor: string | null;
  activeUserCount: number;
  threshold: number;
}

export function useProposals(status: string) {
  return useInfiniteQuery<ProposalsResponse>({
    queryKey: ["proposals", status],
    queryFn: async ({ pageParam }) => {
      const url = new URL("/api/proposals", window.location.origin);
      url.searchParams.set("status", status);
      if (pageParam) url.searchParams.set("cursor", pageParam as string);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch proposals");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });
}
