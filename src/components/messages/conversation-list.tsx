"use client";

import Link from "next/link";
import { useConversations, ConversationData } from "@/hooks/use-conversations";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { formatTimeAgo, cn } from "@/lib/utils";

function ConversationItem({ conversation }: { conversation: ConversationData }) {
  const participant = conversation.participant;
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

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className={cn(
        "flex items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-card-hover",
        conversation.unread && "bg-card/50"
      )}
    >
      {isAgent && !avatarSrc ? (
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-agent-purple/20 flex items-center justify-center">
          <svg className="h-5 w-5 text-agent-purple" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>
      ) : (
        <Avatar src={avatarSrc} alt={displayName} size="md" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("truncate text-sm font-medium", conversation.unread && "text-foreground")}>
              {displayName}
            </span>
            {displayUsername && (
              <span className="truncate text-xs text-muted">
                {displayUsername}
              </span>
            )}
          </div>
          {conversation.lastMessage && (
            <span className="shrink-0 text-xs text-muted">
              {formatTimeAgo(conversation.lastMessage.createdAt)}
            </span>
          )}
        </div>
        {conversation.lastMessage && (
          <p className={cn("mt-0.5 truncate text-sm", conversation.unread ? "text-foreground" : "text-muted")}>
            {conversation.lastMessage.content}
          </p>
        )}
      </div>
      {conversation.unread && (
        <span className="h-2 w-2 shrink-0 rounded-full bg-cyan" />
      )}
    </Link>
  );
}

export function ConversationList() {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useConversations();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  const conversations =
    data?.pages.flatMap((page) => page.conversations) ?? [];

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-muted">
        No conversations yet. Start a new message to begin chatting.
      </div>
    );
  }

  return (
    <InfiniteScroll
      onLoadMore={() => fetchNextPage()}
      hasMore={!!hasNextPage}
      loading={isFetchingNextPage}
    >
      {conversations.map((conversation) => (
        <ConversationItem key={conversation.id} conversation={conversation} />
      ))}
      {isFetchingNextPage && (
        <div className="flex justify-center p-4">
          <Spinner />
        </div>
      )}
    </InfiniteScroll>
  );
}
