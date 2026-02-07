"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AdminPost {
  id: string;
  content: string | null;
  imageUrl: string | null;
  type: "HUMAN" | "AGENT";
  agentName: string | null;
  createdAt: string;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  user: { id: string; name: string | null; username: string | null; image: string | null };
}

interface AdminPostsResponse {
  posts: AdminPost[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseAdminPostsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
}

export function useAdminPosts({ page = 1, pageSize = 20, search = "", type = "" }: UseAdminPostsParams = {}) {
  return useQuery<AdminPostsResponse>({
    queryKey: ["admin", "posts", { page, pageSize, search, type }],
    queryFn: async () => {
      const url = new URL("/api/admin/posts", window.location.origin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("pageSize", String(pageSize));
      if (search) url.searchParams.set("search", search);
      if (type) url.searchParams.set("type", type);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/admin/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to delete post");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}
