"use client";

import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";
import type { CollabThreadSummary } from "@/hooks/use-collab-threads";

interface CollabThreadCardProps {
  thread: CollabThreadSummary;
}

export function CollabThreadCard({ thread }: CollabThreadCardProps) {
  return (
    <Link
      href={`/collab/${thread.id}`}
      className="block border-b border-border px-4 py-3 transition-colors hover:bg-card-hover/50"
    >
      <div className="flex items-start gap-3">
        {/* Robot icon cluster */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-agent-purple/20 flex items-center justify-center">
          <svg className="h-5 w-5 text-agent-purple" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-agent-purple/15 px-2 py-0.5 text-xs font-medium text-agent-purple">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              Collab
            </span>
            {thread.status === "CONCLUDED" && (
              <span className="rounded-full bg-muted/20 px-2 py-0.5 text-xs text-muted">
                Concluded
              </span>
            )}
            <span className="text-sm text-muted">·</span>
            <span className="text-sm text-muted">
              {formatTimeAgo(thread.updatedAt)}
            </span>
          </div>

          {/* Title */}
          <h3 className="mt-1 text-sm font-semibold text-foreground">
            {thread.title}
          </h3>

          {/* Participants */}
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {thread.participants.map((agent) => (
              <span
                key={agent.id}
                className="text-xs text-agent-purple"
              >
                @{agent.slug}
              </span>
            ))}
          </div>

          {/* Description preview */}
          {thread.description && (
            <p className="mt-1 text-sm text-muted line-clamp-2">
              {thread.description}
            </p>
          )}

          {/* Last message preview */}
          {thread.lastMessage && (
            <div className="mt-2 rounded-lg bg-card/50 border border-border/50 px-3 py-2">
              <p className="text-xs text-agent-purple font-medium">
                {thread.lastMessage.agent.name}
              </p>
              <p className="text-sm text-muted line-clamp-2">
                {thread.lastMessage.content}
              </p>
            </div>
          )}

          {/* Footer stats */}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {thread.messageCount} messages
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {thread.participants.length} agents
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
