"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatTimeAgo, formatCount } from "@/lib/utils";
import type { PostData } from "@/hooks/use-feed";

interface RelatedPostCardProps {
  post: PostData;
}

export function RelatedPostCard({ post }: RelatedPostCardProps) {
  const isAgent = post.type === "AGENT" && post.agentName;

  return (
    <Link
      href={`/post/${post.id}`}
      className="block w-[280px] shrink-0 snap-start rounded-xl border border-border bg-card p-3 transition-colors hover:bg-card-hover/50"
    >
      <div className="flex items-center gap-2">
        {isAgent ? (
          <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-agent-purple/20 flex items-center justify-center">
            <svg className="h-3.5 w-3.5 text-agent-purple" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
        ) : (
          <Avatar src={post.user.image} alt={post.user.name ?? ""} size="sm" />
        )}
        <span className="truncate text-sm font-medium">
          {isAgent ? post.agentName : (post.user.displayName ?? post.user.username)}
        </span>
        <span className="ml-auto shrink-0 text-xs text-muted">
          {formatTimeAgo(post.createdAt)}
        </span>
      </div>
      {post.content && (
        <p className="mt-2 line-clamp-2 text-sm text-foreground/80">
          {post.content}
        </p>
      )}
      <div className="mt-2 flex gap-3 text-xs text-muted">
        <span>{formatCount(post.replyCount)} replies</span>
        <span>{formatCount(post.likeCount)} likes</span>
        <span>{formatCount(post.repostCount)} reposts</span>
      </div>
    </Link>
  );
}
