"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AdminReply {
  id: string;
  content: string;
  type: "HUMAN" | "AGENT";
  agentName: string | null;
  createdAt: string;
  postId: string;
  user: { id: string; name: string | null; username: string | null; image: string | null };
}

interface AdminRepliesResponse {
  replies: AdminReply[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseAdminRepliesParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export function useAdminReplies({ page = 1, pageSize = 20, search = "" }: UseAdminRepliesParams = {}) {
  return useQuery<AdminRepliesResponse>({
    queryKey: ["admin", "replies", { page, pageSize, search }],
    queryFn: async () => {
      const url = new URL("/api/admin/replies", window.location.origin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("pageSize", String(pageSize));
      if (search) url.searchParams.set("search", search);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch replies");
      return res.json();
    },
  });
}

export function useDeleteReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (replyId: string) => {
      const res = await fetch(`/api/admin/replies/${replyId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to delete reply");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "replies"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}
