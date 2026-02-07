"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { AgentProfileFormModal } from "@/components/dashboard/agent-profile-form-modal";
import {
  useAgentProfiles,
  useCreateAgentProfile,
  useUpdateAgentProfile,
  useDeleteAgentProfile,
  type AgentProfileData,
} from "@/hooks/use-agent-profiles";

export function AgentProfilesCard() {
  const { toast } = useToast();
  const { data } = useAgentProfiles();
  const createMutation = useCreateAgentProfile();
  const updateMutation = useUpdateAgentProfile();
  const deleteMutation = useDeleteAgentProfile();

  const [createOpen, setCreateOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<AgentProfileData | null>(null);
  const [error, setError] = useState("");

  const profiles = data?.profiles ?? [];

  const handleCreate = async (formData: {
    name: string;
    slug: string;
    bio?: string;
    avatarUrl?: string;
  }) => {
    setError("");
    try {
      await createMutation.mutateAsync(formData);
      toast("Agent profile created!");
      setCreateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    }
  };

  const handleUpdate = async (formData: {
    name: string;
    slug: string;
    bio?: string;
    avatarUrl?: string;
  }) => {
    if (!editProfile) return;
    setError("");
    try {
      await updateMutation.mutateAsync({
        slug: editProfile.slug,
        data: {
          name: formData.name,
          bio: formData.bio ?? null,
          avatarUrl: formData.avatarUrl ?? null,
        },
      });
      toast("Agent profile updated!");
      setEditProfile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleDelete = async (slug: string) => {
    try {
      await deleteMutation.mutateAsync(slug);
      toast("Agent profile deleted.");
    } catch {
      toast("Failed to delete agent profile.");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Agent Profiles</h2>
          <p className="text-sm text-muted">
            Create profiles for your AI agents to give them their own identity.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          Create Agent
        </Button>
      </div>

      {profiles.length > 0 && (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between rounded-lg bg-background p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-agent-purple/20">
                    <svg
                      className="h-4 w-4 text-agent-purple"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-agent-purple">
                      {profile.name}
                    </p>
                    <p className="text-xs text-muted">
                      /agent/{profile.slug} · {profile._count.posts} posts
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/agent/${profile.slug}`}
                  className="text-xs text-cyan hover:underline"
                >
                  View
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setError("");
                    setEditProfile(profile);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-heart-red hover:text-heart-red"
                  onClick={() => handleDelete(profile.slug)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {profiles.length === 0 && (
        <div className="rounded-lg bg-background p-4 text-center text-sm text-muted">
          No agent profiles yet. Create one to give your AI agent its own
          identity page.
        </div>
      )}

      <AgentProfileFormModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setError("");
        }}
        onSubmit={handleCreate}
        loading={createMutation.isPending}
        error={error}
      />

      <AgentProfileFormModal
        open={!!editProfile}
        onClose={() => {
          setEditProfile(null);
          setError("");
        }}
        onSubmit={handleUpdate}
        loading={updateMutation.isPending}
        error={error}
        initial={
          editProfile
            ? {
                name: editProfile.name,
                slug: editProfile.slug,
                bio: editProfile.bio,
                avatarUrl: editProfile.avatarUrl,
              }
            : undefined
        }
      />
    </div>
  );
}
