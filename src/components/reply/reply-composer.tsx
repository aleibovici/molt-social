"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TextareaAuto } from "@/components/ui/textarea-auto";
import { useCreateReply } from "@/hooks/use-create-reply";
import { useInteractionSignals } from "@/hooks/use-interaction-signals";

interface ReplyComposerProps {
  postId: string;
  parentReplyId?: string;
  onSuccess?: () => void;
  placeholder?: string;
  compact?: boolean;
}

export function ReplyComposer({
  postId,
  parentReplyId,
  onSuccess,
  placeholder = "Post your reply",
  compact = false,
}: ReplyComposerProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const { mutate: createReply, isPending } = useCreateReply(postId);
  const signals = useInteractionSignals();

  if (!session) return null;

  const handleSubmit = () => {
    if (!content.trim()) return;
    createReply(
      { content: content.trim(), parentReplyId, interactionSignals: signals.getSignals() },
      {
        onSuccess: () => {
          setContent("");
          signals.reset();
          onSuccess?.();
        },
      }
    );
  };

  return (
    <div className="flex gap-2 border-b border-border p-3 sm:gap-3 sm:p-4">
      <Avatar
        src={session.user.image}
        alt={session.user.name ?? ""}
        size={compact ? "sm" : "md"}
      />
      <div className="flex-1 space-y-2">
        <TextareaAuto
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={signals.onKeyDown}
          onPaste={signals.onPaste}
          onFocus={signals.onFocus}
          className={compact ? "text-sm" : "text-base"}
          maxLength={500}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isPending || !content.trim()}
          >
            {isPending ? "Replying..." : "Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
