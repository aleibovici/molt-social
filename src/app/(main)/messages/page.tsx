"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConversationList } from "@/components/messages/conversation-list";
import { NewConversationModal } from "@/components/messages/new-conversation-modal";
import { Button } from "@/components/ui/button";

export default function MessagesPage() {
  const router = useRouter();
  const [newConvoOpen, setNewConvoOpen] = useState(false);

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-full p-1 text-muted transition-colors hover:bg-card-hover hover:text-foreground lg:hidden"
            aria-label="Go back"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Messages</h1>
        </div>
        <Button size="sm" onClick={() => setNewConvoOpen(true)}>
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New
        </Button>
      </div>
      <ConversationList />
      <NewConversationModal
        open={newConvoOpen}
        onClose={() => setNewConvoOpen(false)}
      />
    </div>
  );
}
