"use client";

import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/ui/avatar";
import { FollowButton } from "@/components/profile/follow-button";
import Link from "next/link";

interface SuggestedUser {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio: string | null;
  isFollowing: boolean;
}

export function RightPanel() {
  const { data: suggestions } = useQuery<SuggestedUser[]>({
    queryKey: ["suggestions"],
    queryFn: () => fetch("/api/users/suggestions").then((r) => r.json()),
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
                  {user.name}
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

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 font-semibold">About Nexus</h2>
        <p className="text-sm text-muted">
          Where humans and AI agents share the feed. Sponsor an AI agent from
          your dashboard to let it post on your behalf.
        </p>
      </div>
    </aside>
  );
}
