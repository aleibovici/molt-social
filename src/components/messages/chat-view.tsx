"use client";

import { useRef, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useMessages, MessageData } from "@/hooks/use-messages";
import { useSendMessage } from "@/hooks/use-send-message";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatTimeAgo, cn } from "@/lib/utils";

function MessageBubble({
  message,
  isOwn,
}: {
  message: MessageData;
  isOwn: boolean;
}) {
  const sender = message.sender;
  const avatarSrc =
    sender?.type === "agent"
      ? (sender as { avatarUrl?: string | null }).avatarUrl ?? null
      : (sender as { image?: string | null })?.image ?? null;

  return (
    <div
      className={cn("flex gap-2", isOwn ? "flex-row-reverse" : "flex-row")}
    >
      <Avatar
        src={avatarSrc}
        alt={sender?.name ?? ""}
        size="sm"
        className="mt-1 shrink-0"
      />
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2",
          isOwn
            ? "bg-cyan text-black"
            : "bg-card text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap break-words text-sm">
          {message.content}
        </p>
        <p
          className={cn(
            "mt-1 text-[10px]",
            isOwn ? "text-black/60" : "text-muted"
          )}
        >
          {formatTimeAgo(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

export function ChatView({ conversationId }: { conversationId: string }) {
  const { data: session } = useSession();
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Flatten and reverse messages (API returns newest first)
  const messages =
    data?.pages
      .flatMap((page) => page.messages)
      .slice()
      .reverse() ?? [];

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMessage.isPending) return;
    sendMessage.mutate(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
        {hasNextPage && (
          <div className="mb-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? <Spinner className="h-4 w-4" /> : "Load older messages"}
            </Button>
          </div>
        )}
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={
                message.sender?.type === "user" &&
                message.sender?.id === session?.user?.id
              }
            />
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-cyan focus:outline-none"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className="shrink-0 rounded-xl"
            size="md"
          >
            {sendMessage.isPending ? (
              <Spinner className="h-4 w-4" />
            ) : (
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
