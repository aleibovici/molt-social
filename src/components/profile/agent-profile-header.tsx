"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCount } from "@/lib/utils";
import { AgentFollowButton } from "@/components/profile/agent-follow-button";
import { ReputationBadge } from "@/components/reputation/reputation-badge";

interface AgentProfileHeaderProps {
  agent: {
    name: string;
    slug: string;
    bio: string | null;
    avatarUrl: string | null;
    createdAt: string;
    postCount: number;
    followerCount: number;
    isFollowing: boolean;
    isOwnAgent: boolean;
    sponsor: {
      name: string | null;
      username: string | null;
      image: string | null;
    };
  };
}

export function AgentProfileHeader({ agent }: AgentProfileHeaderProps) {
  return (
    <div>
      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-agent-purple/30 to-agent-purple/10 sm:h-48" />

      <div className="px-4">
        {/* Avatar + Follow Button */}
        <div className="flex items-end justify-between">
          <div className="-mt-12 sm:-mt-16">
            {agent.avatarUrl ? (
              <Image
                src={agent.avatarUrl}
                alt={agent.name}
                width={112}
                height={112}
                className="h-20 w-20 rounded-full border-4 border-background object-cover sm:h-28 sm:w-28"
                unoptimized
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-background bg-agent-purple/20 sm:h-28 sm:w-28">
                <svg
                  className="h-10 w-10 text-agent-purple sm:h-14 sm:w-14"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </div>
            )}
          </div>
          {!agent.isOwnAgent && (
            <div className="mb-2">
              <AgentFollowButton
                slug={agent.slug}
                initialIsFollowing={agent.isFollowing}
              />
            </div>
          )}
        </div>

        {/* Name */}
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-agent-purple">{agent.name}</h1>
            <ReputationBadge type="agent" identifier={agent.slug} compact />
          </div>
          <p className="text-sm text-muted">@{agent.slug}</p>
          <p className="text-sm text-muted">
            Sponsored by{" "}
            <Link
              href={`/${agent.sponsor.username ?? ""}`}
              className="text-cyan hover:underline"
            >
              @{agent.sponsor.username}
            </Link>
          </p>
        </div>

        {/* Bio */}
        {agent.bio && <p className="mt-2 text-sm">{agent.bio}</p>}

        {/* Joined date + stats */}
        <p className="mt-2 font-mono text-xs text-muted">
          Created{" "}
          {new Date(agent.createdAt).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </p>

        <div className="mt-3 flex gap-4 text-sm">
          <span>
            <strong>{formatCount(agent.postCount)}</strong>{" "}
            <span className="text-muted">Posts</span>
          </span>
          <span>
            <strong>{formatCount(agent.followerCount)}</strong>{" "}
            <span className="text-muted">Followers</span>
          </span>
        </div>

        {/* Reputation */}
        <div className="mt-3">
          <ReputationBadge type="agent" identifier={agent.slug} />
        </div>
      </div>
    </div>
  );
}
