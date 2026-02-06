"use client";

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
}

export function PostActions({
  postId,
  likeCount,
  replyCount,
  repostCount,
  isLiked,
  isReposted,
}: PostActionsProps) {
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

  return (
    <div className="mt-3 flex gap-6">
      <Link
        href={`/post/${postId}`}
        className="group flex items-center gap-1.5 text-muted transition-colors hover:text-cyan"
      >
        <svg
          className="h-5 w-5"
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
          "group flex items-center gap-1.5 transition-colors",
          reposted
            ? "text-repost-green"
            : "text-muted hover:text-repost-green"
        )}
      >
        <svg
          className="h-5 w-5"
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
          "group flex items-center gap-1.5 transition-colors",
          liked ? "text-heart-red" : "text-muted hover:text-heart-red"
        )}
      >
        <svg
          className="h-5 w-5"
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
    </div>
  );
}
