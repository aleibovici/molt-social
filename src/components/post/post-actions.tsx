"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/utils";
import { useLike } from "@/hooks/use-like";
import { useRepost } from "@/hooks/use-repost";
import Link from "next/link";

interface PostActionsProps {
  postId: string;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  isLiked: boolean;
  isReposted: boolean;
  onToggleRelated?: () => void;
  showRelated?: boolean;
  onToggleAi?: () => void;
  showAi?: boolean;
}

export function PostActions({
  postId,
  likeCount,
  replyCount,
  repostCount,
  isLiked,
  isReposted,
  onToggleRelated,
  showRelated,
  onToggleAi,
  showAi,
}: PostActionsProps) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { liked, count: lCount, toggle: toggleLike } = useLike(
    postId,
    isLiked,
    likeCount
  );
  const {
    reposted,
    count: rCount,
    toggle: toggleRepost,
  } = useRepost(postId, isReposted, repostCount);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/post/${postId}`;

    // Use native share sheet on mobile when available
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [postId]);

  return (
    <div className="mt-3 flex items-center gap-0 sm:gap-4">
      <Link
        href={`/post/${postId}`}
        className="group flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-full text-muted transition-colors hover:text-cyan active:bg-cyan/10 sm:gap-1.5"
        title="Replies"
        aria-label={`${formatCount(replyCount)} replies`}
      >
        <svg
          className="h-[18px] w-[18px] sm:h-5 sm:w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span className="text-sm">{formatCount(replyCount)}</span>
      </Link>

      <button
        onClick={toggleRepost}
        className={cn(
          "group flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-full transition-colors active:bg-repost-green/10 sm:gap-1.5",
          reposted
            ? "text-repost-green"
            : "text-muted hover:text-repost-green"
        )}
        title="Repost"
        aria-label={reposted ? "Undo repost" : "Repost"}
        aria-pressed={reposted}
      >
        <svg
          className="h-[18px] w-[18px] sm:h-5 sm:w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span className="text-sm">{formatCount(rCount)}</span>
      </button>

      <button
        onClick={toggleLike}
        className={cn(
          "group flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-full transition-colors active:bg-heart-red/10 sm:gap-1.5",
          liked ? "text-heart-red" : "text-muted hover:text-heart-red"
        )}
        title="Like"
        aria-label={liked ? "Unlike" : "Like"}
        aria-pressed={liked}
      >
        <svg
          className="h-[18px] w-[18px] sm:h-5 sm:w-5"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span className="text-sm">{formatCount(lCount)}</span>
      </button>

      {onToggleRelated && (
        <button
          onClick={onToggleRelated}
          className={cn(
            "group flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-full transition-colors active:bg-cyan/10 sm:gap-1.5",
            showRelated ? "text-cyan" : "text-muted hover:text-cyan"
          )}
          title="Related posts"
          aria-label="Show related posts"
          aria-pressed={showRelated}
        >
          <svg
            className="h-[18px] w-[18px] sm:h-5 sm:w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        </button>
      )}

      {onToggleAi && isAuthenticated ? (
        <button
          onClick={onToggleAi}
          className={cn(
            "group flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-full transition-colors active:bg-cyan/10 sm:gap-1.5",
            showAi ? "text-cyan" : "text-muted hover:text-cyan"
          )}
          title="AI Summary"
          aria-label="Toggle AI summary"
          aria-pressed={showAi}
        >
          <svg
            className="h-[18px] w-[18px] sm:h-5 sm:w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </button>
      ) : !isAuthenticated && (
        <span
          className="group flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 text-muted/50 cursor-default sm:gap-1.5"
          title="Sign in to use AI Summary"
          aria-label="Sign in to use AI Summary"
        >
          <svg
            className="h-[18px] w-[18px] sm:h-5 sm:w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </span>
      )}

      <button
        onClick={handleShare}
        className={cn(
          "group flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-full transition-colors active:bg-cyan/10 sm:gap-1.5",
          copied ? "text-cyan" : "text-muted hover:text-cyan"
        )}
        title="Share link"
        aria-label={copied ? "Link copied" : "Share link"}
      >
        {copied ? (
          <svg
            className="h-[18px] w-[18px] sm:h-5 sm:w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="h-[18px] w-[18px] sm:h-5 sm:w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
        )}
        {copied && <span className="hidden text-sm sm:inline">Copied</span>}
      </button>
    </div>
  );
}
