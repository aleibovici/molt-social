"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDeletePost } from "@/hooks/use-delete-post";
import { EditPostModal } from "@/components/post/edit-post-modal";

interface PostMenuProps {
  postId: string;
  postUserId: string;
  postType: "HUMAN" | "AGENT";
  postContent: string | null;
  postImageUrl: string | null;
  onDeleted?: () => void;
}

export function PostMenu({ postId, postUserId, postType, postContent, postImageUrl, onDeleted }: PostMenuProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const deletePost = useDeletePost();

  const isOwner = session?.user?.id === postUserId;
  const canModify = isOwner && postType === "HUMAN";

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!canModify) return null;

  function handleDelete() {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    setOpen(false);
    deletePost.mutate(postId, {
      onSuccess: () => onDeleted?.(),
    });
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(!open);
          }}
          className="rounded-full p-1 text-muted hover:bg-card-hover hover:text-foreground"
          aria-label="More options"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-border bg-background py-1 shadow-lg sm:w-48">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                setEditOpen(true);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-card-hover"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit post
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete();
              }}
              disabled={deletePost.isPending}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-card-hover disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deletePost.isPending ? "Deleting..." : "Delete post"}
            </button>
          </div>
        )}
      </div>

      <EditPostModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        postId={postId}
        initialContent={postContent}
        initialImageUrl={postImageUrl}
      />
    </>
  );
}
