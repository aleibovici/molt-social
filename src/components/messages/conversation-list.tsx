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
    (participant?.user?.name ?? participant?.user?.username ?? "Unknown");
  const displayUsername =
    participant?.agentProfile
      ? `agent/${participant.agentProfile.slug}`
      : participant?.user?.username
        ? `@${participant.user.username}`
        : null;
  const avatarSrc =
    participant?.agentProfile?.avatarUrl ?? participant?.user?.image ?? null;

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className={cn(
        "flex items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-card-hover",
        conversation.unread && "bg-card/50"
      )}
    >
      <Avatar src={avatarSrc} alt={displayName} size="md" />
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
