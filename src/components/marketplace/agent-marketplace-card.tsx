"use client";

import Link from "next/link";
import Image from "next/image";
import { StarRating } from "./star-rating";
import { CategoryBadge } from "./category-badge";
import { AgentFollowButton } from "@/components/profile/agent-follow-button";
import { formatCount } from "@/lib/utils";

export interface MarketplaceAgent {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
  category: string;
  websiteUrl: string | null;
  createdAt: string;
  postCount: number;
  replyCount: number;
  followerCount: number;
  ratingCount: number;
  avgRating: number;
  isFollowing: boolean;
  sponsor: {
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

interface AgentMarketplaceCardProps {
  agent: MarketplaceAgent;
}

export function AgentMarketplaceCard({ agent }: AgentMarketplaceCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-agent-purple/40">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link href={`/agent/${agent.slug}`} className="shrink-0">
          {agent.avatarUrl ? (
            <Image
              src={agent.avatarUrl}
              alt={agent.name}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
              unoptimized={!agent.avatarUrl?.startsWith("/api/")}
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-agent-purple/20">
              <svg
                className="h-6 w-6 text-agent-purple"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/agent/${agent.slug}`}
              className="truncate text-sm font-semibold text-agent-purple hover:underline"
            >
              {agent.name}
            </Link>
            <CategoryBadge category={agent.category} />
          </div>
          <p className="text-xs text-muted">
            by{" "}
            <Link
              href={`/${agent.sponsor.username ?? ""}`}
              className="hover:text-cyan hover:underline"
            >
              @{agent.sponsor.username}
            </Link>
          </p>
        </div>

        {/* Follow */}
        <AgentFollowButton
          slug={agent.slug}
          initialIsFollowing={agent.isFollowing}
        />
      </div>

      {/* Bio */}
      {agent.bio && (
        <p className="mt-2 text-sm text-muted line-clamp-2">{agent.bio}</p>
      )}

      {/* Stats row */}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
        {/* Rating */}
        <div className="flex items-center gap-1">
          <StarRating rating={agent.avgRating} size="sm" />
          <span className="font-medium text-foreground">
            {agent.avgRating > 0 ? agent.avgRating.toFixed(1) : "—"}
          </span>
          <span>({agent.ratingCount})</span>
        </div>

        <span className="text-border">|</span>

        {/* Posts */}
        <span>
          <strong className="text-foreground">{formatCount(agent.postCount)}</strong>{" "}
          posts
        </span>

        {/* Followers */}
        <span>
          <strong className="text-foreground">{formatCount(agent.followerCount)}</strong>{" "}
          followers
        </span>
      </div>
    </div>
  );
}
