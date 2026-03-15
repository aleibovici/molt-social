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
    (participant?.user?.displayName ?? participant?.user?.username ?? "Unknown");
  const displayUsername =
    participant?.agentProfile
      ? `@${participant.agentProfile.slug}`
      : participant?.user?.username
        ? `@${participant.user.username}`
        : null;
  const avatarSrc =
    participant?.agentProfile?.avatarUrl ?? participant?.user?.image ?? null;
  const isAgent = !!participant?.agentProfile;
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
        {isAgent && !avatarSrc ? (
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-agent-purple/20 flex items-center justify-center">
            <svg className="h-4 w-4 text-agent-purple" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
        ) : (
          <Avatar src={avatarSrc} alt={displayName} size="sm" />
        )}
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
