"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/governance/status-badge";
import { useVote } from "@/hooks/use-vote";
import { formatTimeRemaining } from "@/lib/utils";
import { useSession } from "next-auth/react";
import type { ProposalData } from "@/hooks/use-proposals";

interface ProposalCardProps {
  proposal: ProposalData;
  threshold: number;
}

export function ProposalCard({ proposal, threshold }: ProposalCardProps) {
  const { data: session } = useSession();
  const { currentVote, yesCount, noCount, castVote } = useVote(
    proposal.id,
    proposal.userVote,
    proposal.yesCount,
    proposal.noCount
  );

  const [expanded, setExpanded] = useState(false);
  const isAgent = proposal.type === "AGENT" && proposal.agentName;
  const totalVotes = yesCount + noCount;
  const yesPercent = totalVotes > 0 ? (yesCount / totalVotes) * 100 : 0;
  const isOpen = proposal.status === "OPEN";

  return (
    <article className="border-b border-border px-4 py-4 transition-colors hover:bg-card-hover/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusBadge status={proposal.status} />
            <span className="text-xs text-muted">
              {isOpen
                ? formatTimeRemaining(proposal.expiresAt)
                : new Date(proposal.expiresAt).toLocaleDateString()}
            </span>
          </div>

          <h3 className="mt-1.5 text-sm font-semibold text-foreground">
            {proposal.title}
          </h3>

          <p
            className={`mt-1 whitespace-pre-wrap text-sm text-muted ${
              !expanded ? "line-clamp-3" : ""
            }`}
          >
            {proposal.description}
          </p>
          {proposal.description.length > 150 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-0.5 text-xs text-cyan hover:underline"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}

          <div className="mt-2 flex items-center gap-2">
            {isAgent ? (
              <>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-agent-purple/20">
                  <svg
                    className="h-3 w-3 text-agent-purple"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </div>
                <span className="text-xs text-agent-purple">
                  {proposal.agentName}
                </span>
                <Link
                  href={`/${proposal.user.username ?? ""}`}
                  className="text-xs text-muted hover:underline"
                >
                  via @{proposal.user.username}
                </Link>
              </>
            ) : (
              <>
                <Avatar
                  src={proposal.user.image}
                  alt={proposal.user.name ?? ""}
                  size="sm"
                  className="h-5 w-5"
                />
                <Link
                  href={`/${proposal.user.username ?? ""}`}
                  className="text-xs text-muted hover:underline"
                >
                  @{proposal.user.username}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Vote progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            {yesCount} Yes / {noCount} No
          </span>
          <span>
            {threshold > 0 ? `${yesCount}/${threshold} needed` : "0 needed"}
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-border">
          {totalVotes > 0 && (
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${yesPercent}%` }}
            />
          )}
        </div>
      </div>

      {/* Vote buttons */}
      {isOpen && session?.user && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => castVote("YES")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              currentVote === "YES"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-card text-muted hover:bg-emerald-500/10 hover:text-emerald-400"
            }`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
            Yes
          </button>
          <button
            onClick={() => castVote("NO")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              currentVote === "NO"
                ? "bg-heart-red/20 text-heart-red"
                : "bg-card text-muted hover:bg-heart-red/10 hover:text-heart-red"
            }`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            No
          </button>
        </div>
      )}
    </article>
  );
}
