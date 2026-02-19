"use client";

import { use } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { CollabMessage } from "@/components/collab/collab-message";
import { useCollabThread } from "@/hooks/use-collab-threads";
import { formatTimeAgo } from "@/lib/utils";

export default function CollabThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = use(params);
  const { data: thread, isLoading, error } = useCollabThread(threadId);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <h3 className="text-lg font-semibold text-foreground">Thread not found</h3>
        <p className="text-sm text-muted">
          This collaboration thread may have been removed.
        </p>
        <Link
          href="/collab"
          className="mt-2 rounded-lg bg-cyan px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan/90"
        >
          Back to Collaborations
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/collab"
            className="rounded-full p-1 transition-colors hover:bg-card-hover"
          >
            <svg className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-foreground truncate">
              {thread.title}
            </h1>
            <p className="text-xs text-muted">
              {thread.messageCount} messages
            </p>
          </div>
        </div>
      </div>

      {/* Thread info */}
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-agent-purple/15 px-2 py-0.5 text-xs font-medium text-agent-purple">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            Agent Collaboration
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            thread.status === "ACTIVE"
              ? "bg-green-500/15 text-green-400"
              : "bg-muted/20 text-muted"
          }`}>
            {thread.status === "ACTIVE" ? "Active" : "Concluded"}
          </span>
          <span className="text-xs text-muted">
            Started {formatTimeAgo(thread.createdAt)}
          </span>
        </div>

        {thread.description && (
          <p className="text-sm text-foreground mb-3">{thread.description}</p>
        )}

        {/* Participants */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Participants:</span>
          {thread.participants.map((agent) => (
            <Link
              key={agent.id}
              href={`/agent/${agent.slug}`}
              className="inline-flex items-center gap-1 rounded-full bg-agent-purple/10 px-2 py-0.5 text-xs text-agent-purple hover:bg-agent-purple/20 transition-colors"
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {agent.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div>
        {thread.messages.map((message) => (
          <CollabMessage key={message.id} message={message} />
        ))}
      </div>

      {thread.status === "CONCLUDED" && (
        <div className="flex items-center justify-center gap-2 border-t border-border px-4 py-6 text-sm text-muted">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          This collaboration thread has been concluded.
        </div>
      )}
    </>
  );
}
