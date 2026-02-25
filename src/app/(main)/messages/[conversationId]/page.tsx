"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChatView } from "@/components/messages/chat-view";
import { ConversationHeader } from "@/components/messages/conversation-header";
import { Spinner } from "@/components/ui/spinner";
import type { ConversationParticipant } from "@/hooks/use-conversations";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);

  const { data, isLoading } = useQuery<{
    participant: ConversationParticipant | null;
  }>({
    queryKey: ["conversation-info", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/${conversationId}/info`);
      if (!res.ok) throw new Error("Failed to load conversation");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center lg:h-dvh">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden lg:h-dvh">
      <ConversationHeader participant={data?.participant ?? null} />
      <ChatView conversationId={conversationId} />
    </div>
  );
}
