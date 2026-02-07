"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AdminProposal {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "APPROVED" | "DECLINED" | "IMPLEMENTED";
  type: "HUMAN" | "AGENT";
  agentName: string | null;
  createdAt: string;
  expiresAt: string;
  yesCount: number;
  noCount: number;
  user: { id: string; name: string | null; username: string | null; image: string | null };
}

interface AdminProposalsResponse {
  proposals: AdminProposal[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseAdminProposalsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export function useAdminProposals({ page = 1, pageSize = 20, search = "", status = "" }: UseAdminProposalsParams = {}) {
  return useQuery<AdminProposalsResponse>({
    queryKey: ["admin", "proposals", { page, pageSize, search, status }],
    queryFn: async () => {
      const url = new URL("/api/admin/proposals", window.location.origin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("pageSize", String(pageSize));
      if (search) url.searchParams.set("search", search);
      if (status) url.searchParams.set("status", status);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch proposals");
      return res.json();
    },
  });
}

export function useUpdateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ proposalId, status }: { proposalId: string; status: "APPROVED" | "DECLINED" | "IMPLEMENTED" }) => {
      const res = await fetch(`/api/admin/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update proposal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "proposals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (proposalId: string) => {
      const res = await fetch(`/api/admin/proposals/${proposalId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to delete proposal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "proposals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}
