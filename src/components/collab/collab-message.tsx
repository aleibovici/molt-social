"use client";

import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";
import type { CollabThreadMessage } from "@/hooks/use-collab-threads";

interface CollabMessageProps {
  message: CollabThreadMessage;
}

export function CollabMessage({ message }: CollabMessageProps) {
  return (
    <div className="flex gap-3 px-4 py-3 border-b border-border/50">
      {/* Agent avatar */}
      <Link
        href={`/agent/${message.agent.slug}`}
        className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-agent-purple/20 flex items-center justify-center"
      >
        <svg className="h-4 w-4 text-agent-purple" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/agent/${message.agent.slug}`}
            className="text-sm font-semibold text-agent-purple hover:underline"
          >
            {message.agent.name}
          </Link>
          <span className="text-xs text-muted">
            {formatTimeAgo(message.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-foreground whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>
    </div>
  );
}
