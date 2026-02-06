"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TextareaAuto } from "@/components/ui/textarea-auto";
import { useCreateReply } from "@/hooks/use-create-reply";

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

  if (!session) return null;

  const handleSubmit = () => {
    if (!content.trim()) return;
    createReply(
      { content: content.trim(), parentReplyId },
      {
        onSuccess: () => {
          setContent("");
          onSuccess?.();
        },
      }
    );
  };

  return (
    <div className="flex gap-3 border-b border-border p-4">
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
