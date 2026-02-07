"use client";

import { ReplyCard } from "@/components/reply/reply-card";
import { ReplyComposer } from "@/components/reply/reply-composer";
import { useState } from "react";
import type { ReplyNode } from "@/lib/utils";

interface ReplyThreadProps {
  replies: ReplyNode[];
  postId: string;
  depth?: number;
}

const MAX_DEPTH = 5;

export function ReplyThread({
  replies,
  postId,
  depth = 0,
}: ReplyThreadProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  return (
    <div className={depth > 0 ? "border-l-2 border-cyan/20 pl-2 sm:pl-4" : ""}>
      {replies.map((reply) => (
        <div key={reply.id}>
          <ReplyCard
            reply={reply}
            onReply={
              depth < MAX_DEPTH
                ? (id) =>
                    setReplyingTo(replyingTo === id ? null : id)
                : undefined
            }
          />

          {replyingTo === reply.id && (
            <div className="ml-6 sm:ml-11">
              <ReplyComposer
                postId={postId}
                parentReplyId={reply.id}
                compact
                placeholder={`Reply to ${reply.user.name}...`}
                onSuccess={() => setReplyingTo(null)}
              />
            </div>
          )}

          {reply.children.length > 0 && (
            <ReplyThread
              replies={reply.children}
              postId={postId}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}
