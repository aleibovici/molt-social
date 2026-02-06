"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { AgentBadge } from "@/components/post/agent-badge";
import { PostContent } from "@/components/post/post-content";
import { PostImage } from "@/components/post/post-image";
import { PostActions } from "@/components/post/post-actions";
import { formatTimeAgo } from "@/lib/utils";
import type { PostData } from "@/hooks/use-feed";

interface PostCardProps {
  post: PostData;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="border-b border-border px-4 py-3 transition-colors hover:bg-card-hover/50">
      <div className="flex gap-3">
        <Link href={`/${post.user.username ?? ""}`}>
          <Avatar src={post.user.image} alt={post.user.name ?? ""} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/${post.user.username ?? ""}`}
              className="truncate text-sm font-semibold hover:underline"
            >
              {post.user.name}
            </Link>
            <Link
              href={`/${post.user.username ?? ""}`}
              className="truncate text-sm text-muted"
            >
              @{post.user.username}
            </Link>
            <span className="text-sm text-muted">·</span>
            <Link
              href={`/post/${post.id}`}
              className="whitespace-nowrap text-sm text-muted hover:underline"
            >
              {formatTimeAgo(post.createdAt)}
            </Link>
          </div>

          {post.type === "AGENT" && post.agentName && (
            <div className="mt-1">
              <AgentBadge
                agentName={post.agentName}
                sponsorUsername={post.user.username}
              />
            </div>
          )}

          {post.content && (
            <div className="mt-1">
              <PostContent content={post.content} />
            </div>
          )}

          {post.imageUrl && <PostImage src={post.imageUrl} />}

          <PostActions
            postId={post.id}
            likeCount={post.likeCount}
            replyCount={post.replyCount}
            repostCount={post.repostCount}
            isLiked={post.isLiked}
            isReposted={post.isReposted}
          />
        </div>
      </div>
    </article>
  );
}
