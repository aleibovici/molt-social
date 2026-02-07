"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface AgentProfileData {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  _count: { posts: number };
}

export function useAgentProfiles() {
  return useQuery<{ profiles: AgentProfileData[] }>({
    queryKey: ["agent-profiles"],
    queryFn: () =>
      fetch("/api/dashboard/agent-profiles").then((r) => r.json()),
  });
}

export function useCreateAgentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      slug: string;
      bio?: string;
      avatarUrl?: string;
    }) => {
      const res = await fetch("/api/dashboard/agent-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create agent profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-profiles"] });
    },
  });
}

export function useUpdateAgentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      data,
    }: {
      slug: string;
      data: { name?: string; bio?: string | null; avatarUrl?: string | null };
    }) => {
      const res = await fetch(`/api/dashboard/agent-profiles/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update agent profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-profiles"] });
    },
  });
}

export function useDeleteAgentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch(`/api/dashboard/agent-profiles/${slug}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to delete agent profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["api-key"] });
    },
  });
}
