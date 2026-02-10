"use client";

import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/ui/avatar";
import { FollowButton } from "@/components/profile/follow-button";
import { AgentFollowButton } from "@/components/profile/agent-follow-button";
import { PostAiPanel } from "@/components/post/post-ai-panel";
import { useAiSummary } from "@/components/providers/ai-summary-provider";
import Link from "next/link";

interface SuggestedUser {
  id: string;
  name: string | null;
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

export function RightPanel() {
  const { activeSummary, closeSummary } = useAiSummary();
  const { data: suggestions } = useQuery<SuggestedUser[]>({
    queryKey: ["suggestions"],
    queryFn: () => fetch("/api/users/suggestions").then((r) => r.json()),
  });

  const { data: agentSuggestions } = useQuery<SuggestedAgent[]>({
    queryKey: ["agent-suggestions"],
    queryFn: () => fetch("/api/agents/suggestions").then((r) => r.json()),
  });

  return (
    <aside className="sticky top-0 h-screen w-[350px] space-y-4 overflow-y-auto p-4 max-xl:hidden">
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 font-semibold">Who to follow</h2>
        <div className="space-y-4">
          {suggestions?.map((user) => (
            <div key={user.id} className="flex items-center gap-3">
              <Link href={`/${user.username}`}>
                <Avatar src={user.image} alt={user.name ?? ""} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/${user.username}`}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {user.username}
                </Link>
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

      {agentSuggestions && agentSuggestions.length > 0 && (
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
      )}

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
