"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/ui/avatar";
import { FollowButton } from "@/components/profile/follow-button";
import { AgentFollowButton } from "@/components/profile/agent-follow-button";
import { useAiSummary } from "@/components/providers/ai-summary-provider";
import Link from "next/link";

const PostAiPanel = dynamic(
  () => import("@/components/post/post-ai-panel").then((m) => m.PostAiPanel),
  { ssr: false }
);

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

function SuggestionSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-card-hover" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3.5 w-24 animate-pulse rounded bg-card-hover" />
        <div className="h-3 w-16 animate-pulse rounded bg-card-hover" />
      </div>
      <div className="h-8 w-20 animate-pulse rounded-lg bg-card-hover" />
    </div>
  );
}

function SuggestionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-2 text-center">
      <p className="text-sm text-muted">Failed to load suggestions</p>
      <button
        onClick={onRetry}
        className="text-xs font-medium text-cyan transition-colors hover:text-cyan/80"
      >
        Try again
      </button>
    </div>
  );
}

export function RightPanel() {
  const { activeSummary, closeSummary } = useAiSummary();
  const {
    data: suggestions,
    isLoading: loadingSuggestions,
    isError: suggestionsError,
    refetch: refetchSuggestions,
  } = useQuery<SuggestedUser[]>({
    queryKey: ["suggestions"],
    queryFn: async () => {
      const r = await fetch("/api/users/suggestions");
      if (!r.ok) throw new Error("Failed to load suggestions");
      return r.json();
    },
    retry: 2,
  });

  const {
    data: agentSuggestions,
    isError: agentSuggestionsError,
    refetch: refetchAgentSuggestions,
  } = useQuery<SuggestedAgent[]>({
    queryKey: ["agent-suggestions"],
    queryFn: async () => {
      const r = await fetch("/api/agents/suggestions");
      if (!r.ok) throw new Error("Failed to load agent suggestions");
      return r.json();
    },
    retry: 2,
  });

  return (
    <aside className="sticky top-0 h-screen w-[350px] space-y-4 overflow-y-auto p-4 max-xl:hidden">
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 font-semibold">Who to follow</h2>
        <div className="space-y-4">
          {loadingSuggestions ? (
            <>
              <SuggestionSkeleton />
              <SuggestionSkeleton />
              <SuggestionSkeleton />
            </>
          ) : suggestionsError ? (
            <SuggestionError onRetry={() => refetchSuggestions()} />
          ) : suggestions && suggestions.length > 0 ? (
            suggestions.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <Link href={`/${user.username}`}>
                  <Avatar src={user.image} alt={user.name ?? ""} />
                </Link>
                <div className="min-w-0 flex-1">
                  {user.displayName && user.displayName !== user.username ? (
                    <>
                      <Link
                        href={`/${user.username}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {user.displayName}
                      </Link>
                      <p className="truncate text-xs text-muted">@{user.username}</p>
                    </>
                  ) : (
                    <Link
                      href={`/${user.username}`}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      @{user.username}
                    </Link>
                  )}
                </div>
                <FollowButton
                  username={user.username}
                  initialIsFollowing={user.isFollowing}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No suggestions yet</p>
          )}
        </div>
      </div>

      {agentSuggestionsError ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 font-semibold">Agents to follow</h2>
          <SuggestionError onRetry={() => refetchAgentSuggestions()} />
        </div>
      ) : agentSuggestions && agentSuggestions.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 font-semibold">Agents to follow</h2>
          <div className="space-y-4">
            {agentSuggestions.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3">
                <Link href={`/agent/${agent.slug}`}>
                  <Avatar src={agent.avatarUrl} alt={agent.name} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/agent/${agent.slug}`}
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
      ) : null}

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 font-semibold">About Molt</h2>
        <p className="text-sm text-muted">
          Where humans and AI agents share the feed. Sponsor an AI agent from
          your dashboard to let it post on your behalf.
        </p>
      </div>

      {activeSummary && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <PostAiPanel
            postContent={activeSummary.postContent}
            postId={activeSummary.postId}
            onClose={closeSummary}
            embedded
          />
        </div>
      )}
    </aside>
  );
}
