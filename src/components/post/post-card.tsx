"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";

import { PostContent } from "@/components/post/post-content";
import { PostImage } from "@/components/post/post-image";
import { LinkPreview } from "@/components/post/link-preview";
import { PostActions } from "@/components/post/post-actions";
import { PostMenu } from "@/components/post/post-menu";
import { RelatedPostsCarousel } from "@/components/post/related-posts-carousel";
import { PostAiPanel } from "@/components/post/post-ai-panel";
import { useAiSummary } from "@/components/providers/ai-summary-provider";
import { useIsRightPanelVisible } from "@/hooks/use-media-query";
import { formatTimeAgo } from "@/lib/utils";
import type { PostData } from "@/hooks/use-feed";

interface PostCardProps {
  post: PostData;
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const [showRelated, setShowRelated] = useState(false);
  const { openSummary, closeSummary, isSummaryOpenFor } = useAiSummary();
  const isRightPanelVisible = useIsRightPanelVisible();
  const showAi = isSummaryOpenFor(post.id);
  const isAgent = post.type === "AGENT" && post.agentName;

  const handleToggleAi = () => {
    if (showAi) closeSummary();
    else if (post.content) openSummary(post.id, post.content);
  };

  return (
    <article className="border-b border-border px-4 py-3 transition-colors hover:bg-card-hover/50">
      <div className="flex gap-3">
        {isAgent ? (
          post.agentProfileSlug ? (
            <Link href={`/agent/${post.agentProfileSlug}`} className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-agent-purple/20 flex items-center justify-center">
              <svg className="h-5 w-5 text-agent-purple" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </Link>
          ) : (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-agent-purple/20 flex items-center justify-center">
              <svg className="h-5 w-5 text-agent-purple" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </div>
          )
        ) : (
          <Link href={`/${post.user.username ?? ""}`}>
            <Avatar src={post.user.image} alt={post.user.name ?? ""} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0">
              {isAgent ? (
                <>
                  {post.agentProfileSlug ? (
                    <Link
                      href={`/agent/${post.agentProfileSlug}`}
                      className="truncate text-sm font-semibold text-agent-purple hover:underline"
                    >
                      {post.agentName}
                    </Link>
                  ) : (
                    <span className="truncate text-sm font-semibold text-agent-purple">
                      {post.agentName}
                    </span>
                  )}
                  <Link
                    href={`/${post.user.username ?? ""}`}
                    className="truncate text-xs text-muted hover:underline"
                  >
                    Sponsored by @{post.user.username}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={`/${post.user.username ?? ""}`}
                    className="truncate text-sm font-semibold hover:underline"
                  >
                    {post.user.displayName ?? post.user.username}
                  </Link>
                  <Link
                    href={`/${post.user.username ?? ""}`}
                    className="hidden truncate text-sm text-muted min-[480px]:inline"
                  >
                    @{post.user.username}
                  </Link>
                </>
              )}
              <span className="text-sm text-muted">·</span>
              <Link
                href={`/post/${post.id}`}
                className="whitespace-nowrap text-sm text-muted hover:underline"
              >
                {formatTimeAgo(post.createdAt)}
              </Link>
              {post.updatedAt !== post.createdAt && (
                <span className="text-xs text-muted">(edited)</span>
              )}
            </div>
            <PostMenu
              postId={post.id}
              postUserId={post.user.id}
              postType={post.type}
              postContent={post.content}
              postImageUrl={post.imageUrl}
            />
          </div>

          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="cursor-pointer"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest("a, button")) return;
              router.push(`/post/${post.id}`);
            }}
          >
            {post.content && (
              <div className="mt-1">
                <PostContent content={post.content} />
              </div>
            )}

            {post.imageUrl && <PostImage src={post.imageUrl} />}

            {!post.imageUrl && post.linkPreviewUrl && post.linkPreviewImage && (
              <LinkPreview
                url={post.linkPreviewUrl}
                image={post.linkPreviewImage}
                title={post.linkPreviewTitle}
                domain={post.linkPreviewDomain}
              />
            )}
          </div>

          <PostActions
            postId={post.id}
            likeCount={post.likeCount}
            replyCount={post.replyCount}
            repostCount={post.repostCount}
            isLiked={post.isLiked}
            isReposted={post.isReposted}
            onToggleRelated={() => setShowRelated((v) => !v)}
            showRelated={showRelated}
            onToggleAi={handleToggleAi}
            showAi={showAi}
          />
        </div>
      </div>
      <RelatedPostsCarousel postId={post.id} enabled={showRelated} />
      {showAi && post.content && !isRightPanelVisible && (
        <PostAiPanel
          postContent={post.content}
          postId={post.id}
          onClose={closeSummary}
        />
      )}
    </article>
  );
}
