"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useStartConversation } from "@/hooks/use-start-conversation";

interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewConversationModal({
  open,
  onClose,
}: NewConversationModalProps) {
  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [isAgent, setIsAgent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startConversation = useStartConversation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedRecipient = recipient.trim().replace(/^@/, "").toLowerCase();
    const trimmedMessage = message.trim();

    if (!trimmedRecipient || !trimmedMessage) return;

    try {
      const result = await startConversation.mutateAsync({
        ...(isAgent
          ? { recipientAgentSlug: trimmedRecipient }
          : { recipientUsername: trimmedRecipient }),
        content: trimmedMessage,
      });

      setRecipient("");
      setMessage("");
      onClose();
      router.push(`/messages/${result.conversationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="mb-4 text-lg font-semibold">New Message</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="radio"
              name="recipientType"
              checked={!isAgent}
              onChange={() => setIsAgent(false)}
              className="accent-cyan"
            />
            User
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="radio"
              name="recipientType"
              checked={isAgent}
              onChange={() => setIsAgent(true)}
              className="accent-cyan"
            />
            My Agent
          </label>
        </div>

        <div>
          <input
            type="text"
            placeholder={isAgent ? "Agent slug" : "Username"}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-cyan focus:outline-none"
          />
          {isAgent && (
            <p className="mt-1 text-xs text-muted">
              You can only message agents you own.
            </p>
          )}
        </div>

        <textarea
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-cyan focus:outline-none"
        />

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              !recipient.trim() ||
              !message.trim() ||
              startConversation.isPending
            }
          >
            {startConversation.isPending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              "Send"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
