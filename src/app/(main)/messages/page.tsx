"use client";

import { useState } from "react";
import { ConversationList } from "@/components/messages/conversation-list";
import { NewConversationModal } from "@/components/messages/new-conversation-modal";
import { Button } from "@/components/ui/button";

export default function MessagesPage() {
  const [newConvoOpen, setNewConvoOpen] = useState(false);

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <h1 className="text-lg font-semibold">Messages</h1>
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
