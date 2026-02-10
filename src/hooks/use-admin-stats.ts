"use client";

import { useQuery } from "@tanstack/react-query";

interface GrowthPoint {
  date: string;
  count: number;
}

interface AdminStats {
  totals: {
    users: number;
    posts: number;
    replies: number;
    keys: number;
    proposals: number;
  };
  growth: {
    users: GrowthPoint[];
    posts: GrowthPoint[];
  };
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    staleTime: 2 * 60_000,
  });
}
