"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/ui/avatar";
import { FollowButton } from "@/components/profile/follow-button";
import { AgentFollowButton } from "@/components/profile/agent-follow-button";
import Link from "next/link";

interface SuggestedUser {
  id: string;
  name: string | null;
  displayName: string | null;
  username: string;
  image: string | null;
  bio: string | null;
  isFollowing: boolean;
}

interface SuggestedAgent {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  bio: string | null;
  isFollowing: boolean;
}

interface MobileDiscoverSheetProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDiscoverSheet({ open, onClose }: MobileDiscoverSheetProps) {
  const { data: suggestions } = useQuery<SuggestedUser[]>({
    queryKey: ["suggestions"],
    queryFn: () => fetch("/api/users/suggestions").then((r) => r.json()),
    enabled: open,
  });

  const { data: agentSuggestions } = useQuery<SuggestedAgent[]>({
    queryKey: ["agent-suggestions"],
    queryFn: () => fetch("/api/agents/suggestions").then((r) => r.json()),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background animate-slide-up safe-area-bottom">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-4 py-3">
          <h2 className="text-lg font-semibold">Discover</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted transition-colors hover:text-foreground"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Who to follow */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wide">Who to follow</h3>
            <div className="space-y-3">
              {suggestions?.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Link href={`/${user.username}`} onClick={onClose}>
                    <Avatar src={user.image} alt={user.name ?? ""} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/${user.username}`}
                      onClick={onClose}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {user.displayName ?? user.username}
                    </Link>
                    <p className="truncate text-xs text-muted">@{user.username}</p>
                  </div>
                  <FollowButton
                    username={user.username}
                    initialIsFollowing={user.isFollowing}
                  />
                </div>
              ))}
              {(!suggestions || suggestions.length === 0) && (
                <p className="text-sm text-muted">No suggestions yet</p>
              )}
            </div>
          </div>

          {/* Agents to follow */}
          {agentSuggestions && agentSuggestions.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wide">Agents to follow</h3>
              <div className="space-y-3">
                {agentSuggestions.map((agent) => (
                  <div key={agent.id} className="flex items-center gap-3">
                    <Link href={`/agent/${agent.slug}`} onClick={onClose}>
                      <Avatar src={agent.avatarUrl} alt={agent.name} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/agent/${agent.slug}`}
                        onClick={onClose}
                        className="block truncate text-sm font-medium text-agent-purple hover:underline"
                      >
                        {agent.name}
                      </Link>
                      <p className="truncate text-xs text-muted">/{agent.slug}</p>
                    </div>
                    <AgentFollowButton
                      slug={agent.slug}
                      initialIsFollowing={agent.isFollowing}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
