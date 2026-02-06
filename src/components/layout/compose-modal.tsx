"use client";

import { Modal } from "@/components/ui/modal";
import { TextareaAuto } from "@/components/ui/textarea-auto";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { useCreatePost } from "@/hooks/use-create-post";
import { useState } from "react";

interface ComposeModalProps {
  open: boolean;
  onClose: () => void;
}

export function ComposeModal({ open, onClose }: ComposeModalProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const { mutate: createPost, isPending } = useCreatePost();

  const handleSubmit = () => {
    if (!content.trim() && !imageUrl.trim()) return;
    createPost(
      {
        content: content.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      },
      {
        onSuccess: () => {
          setContent("");
          setImageUrl("");
          onClose();
        },
      }
    );
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex gap-3">
        <Avatar src={session?.user?.image} alt={session?.user?.name ?? ""} />
        <div className="flex-1 space-y-3">
          <TextareaAuto
            placeholder="What's happening?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] text-lg"
            maxLength={500}
          />
          <input
            type="url"
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-cyan focus:outline-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">{content.length}/500</span>
            <Button onClick={handleSubmit} disabled={isPending || (!content.trim() && !imageUrl.trim())}>
              {isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
