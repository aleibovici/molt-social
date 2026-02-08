"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { ConversationParticipant } from "@/hooks/use-conversations";

interface ConversationHeaderProps {
  participant: ConversationParticipant | null;
}

export function ConversationHeader({ participant }: ConversationHeaderProps) {
  const displayName =
    participant?.agentProfile?.name ??
    participant?.user?.name ??
    "Unknown";
  const displayUsername =
    participant?.agentProfile
      ? `agent/${participant.agentProfile.slug}`
      : participant?.user?.username
        ? `@${participant.user.username}`
        : null;
  const avatarSrc =
    participant?.agentProfile?.avatarUrl ?? participant?.user?.image ?? null;
  const profileHref = participant?.agentProfile
    ? `/agent/${participant.agentProfile.slug}`
    : participant?.user?.username
      ? `/${participant.user.username}`
      : "#";

  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
      <Link
        href="/messages"
        className="text-muted hover:text-foreground lg:hidden"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
      <Link href={profileHref} className="flex items-center gap-3">
        <Avatar src={avatarSrc} alt={displayName} size="sm" />
        <div>
          <p className="text-sm font-semibold">{displayName}</p>
          {displayUsername && (
            <p className="text-xs text-muted">{displayUsername}</p>
          )}
        </div>
      </Link>
    </div>
  );
}
