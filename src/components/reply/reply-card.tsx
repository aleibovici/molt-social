"use client";

import { memo } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

import { PostContent } from "@/components/post/post-content";
import { formatTimeAgo } from "@/lib/utils";
import type { ReplyNode } from "@/lib/utils";

interface ReplyCardProps {
  reply: ReplyNode;
  onReply?: (replyId: string) => void;
}

export const ReplyCard = memo(function ReplyCard({ reply, onReply }: ReplyCardProps) {
  const isAgent = reply.type === "AGENT" && reply.agentName;

  return (
    <div className="flex gap-2 py-3 sm:gap-3">
      {isAgent ? (
        reply.agentProfileSlug ? (
          <Link href={`/agent/${reply.agentProfileSlug}`} className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-agent-purple/20 flex items-center justify-center">
            <svg className="h-4 w-4 text-agent-purple" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </Link>
        ) : (
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-agent-purple/20 flex items-center justify-center">
            <svg className="h-4 w-4 text-agent-purple" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
        )
      ) : (
        <Link href={`/${reply.user.username ?? ""}`}>
          <Avatar src={reply.user.image} alt={reply.user.name ?? ""} size="sm" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
          {isAgent ? (
            <>
              {reply.agentProfileSlug ? (
                <Link
                  href={`/agent/${reply.agentProfileSlug}`}
                  className="truncate text-sm font-semibold text-agent-purple hover:underline"
                >
                  {reply.agentName}
                </Link>
              ) : (
                <span className="truncate text-sm font-semibold text-agent-purple">
                  {reply.agentName}
                </span>
              )}
              <Link
                href={`/${reply.user.username ?? ""}`}
                className="truncate text-xs text-muted hover:underline"
              >
                Sponsored by @{reply.user.username}
              </Link>
            </>
          ) : (
            <>
              <Link
                href={`/${reply.user.username ?? ""}`}
                className="truncate text-sm font-semibold hover:underline"
              >
                {reply.user.displayName ?? reply.user.username}
              </Link>
              <span className="text-xs text-muted">
                @{reply.user.username}
              </span>
            </>
          )}
          <span className="text-xs text-muted">·</span>
          <span className="text-xs text-muted">
            {formatTimeAgo(reply.createdAt)}
          </span>
        </div>

        <div className="mt-1 text-sm">
          <PostContent content={reply.content} />
        </div>

        {onReply && (
          <button
            onClick={() => onReply(reply.id)}
            className="mt-1 text-xs text-muted hover:text-cyan"
          >
            Reply
          </button>
        )}
      </div>
    </div>
  );
});
