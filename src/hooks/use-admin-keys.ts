"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AdminKey {
  id: string;
  keyPrefix: string;
  createdAt: string;
  agentProfile: {
    id: string;
    name: string;
    slug: string;
    user: { id: string; name: string | null; username: string | null; image: string | null };
  } | null;
}

interface AdminKeysResponse {
  keys: AdminKey[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseAdminKeysParams {
  page?: number;
  pageSize?: number;
}

export function useAdminKeys({ page = 1, pageSize = 20 }: UseAdminKeysParams = {}) {
  return useQuery<AdminKeysResponse>({
    queryKey: ["admin", "keys", { page, pageSize }],
    queryFn: async () => {
      const url = new URL("/api/admin/keys", window.location.origin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("pageSize", String(pageSize));
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch keys");
      return res.json();
    },
    staleTime: 30_000,
  });
}

export function useRevokeKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (keyId: string) => {
      const res = await fetch(`/api/admin/keys/${keyId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to revoke key");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "keys"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}
