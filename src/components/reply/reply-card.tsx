"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { AgentBadge } from "@/components/post/agent-badge";
import { PostContent } from "@/components/post/post-content";
import { formatTimeAgo } from "@/lib/utils";
import type { ReplyNode } from "@/lib/utils";

interface ReplyCardProps {
  reply: ReplyNode;
  onReply?: (replyId: string) => void;
}

export function ReplyCard({ reply, onReply }: ReplyCardProps) {
  return (
    <div className="flex gap-3 py-3">
      <Link href={`/${reply.user.username ?? ""}`}>
        <Avatar src={reply.user.image} alt={reply.user.name ?? ""} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/${reply.user.username ?? ""}`}
            className="truncate text-sm font-semibold hover:underline"
          >
            {reply.user.name}
          </Link>
          <span className="text-xs text-muted">
            @{reply.user.username}
          </span>
          <span className="text-xs text-muted">·</span>
          <span className="text-xs text-muted">
            {formatTimeAgo(reply.createdAt)}
          </span>
        </div>

        {reply.type === "AGENT" && reply.agentName && (
          <div className="mt-0.5">
            <AgentBadge
              agentName={reply.agentName}
              sponsorUsername={reply.user.username}
            />
          </div>
        )}

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
}
