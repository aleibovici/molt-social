"use client";

import { Modal } from "@/components/ui/modal";
import { TextareaAuto } from "@/components/ui/textarea-auto";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useEditPost } from "@/hooks/use-edit-post";
import { useUploadImage } from "@/hooks/use-upload-image";
import { useState, useRef, useCallback, useEffect } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface EditPostModalProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  initialContent: string | null;
  initialImageUrl: string | null;
}

export function EditPostModal({
  open,
  onClose,
  postId,
  initialContent,
  initialImageUrl,
}: EditPostModalProps) {
  const [content, setContent] = useState(initialContent ?? "");
  const [imageUrl, setImageUrl] = useState(initialImageUrl ?? "");
  const [previewUrl, setPreviewUrl] = useState(initialImageUrl ?? "");
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: editPost, isPending } = useEditPost();
  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();

  // Reset state when modal opens with new post data
  useEffect(() => {
    if (open) {
      setContent(initialContent ?? "");
      setImageUrl(initialImageUrl ?? "");
      setPreviewUrl(initialImageUrl ?? "");
      setFileError("");
    }
  }, [open, initialContent, initialImageUrl]);

  const handleFile = useCallback(
    (file: File) => {
      setFileError("");

      if (!ALLOWED_TYPES.includes(file.type)) {
        setFileError("Invalid file type. Allowed: JPEG, PNG, GIF, WebP");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setFileError("File too large. Maximum size is 5 MB");
        return;
      }

      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setImageUrl("");

      uploadImage(file, {
        onSuccess: (url) => {
          setImageUrl(url);
          URL.revokeObjectURL(localUrl);
        },
        onError: (err) => {
          setFileError(err.message);
          setPreviewUrl("");
          setImageUrl("");
          URL.revokeObjectURL(localUrl);
        },
      });
    },
    [uploadImage]
  );

  const removeImage = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
    setImageUrl("");
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!content.trim() && !imageUrl) return;
    editPost(
      {
        postId,
        content: content.trim() || undefined,
        imageUrl: imageUrl || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const canSave = !isPending && !isUploading && (!!content.trim() || !!imageUrl);

  return (
    <Modal open={open} onClose={onClose}>
      <div
        className="flex gap-3"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`flex-1 space-y-3 ${isDragging ? "rounded-lg ring-2 ring-cyan ring-offset-2 ring-offset-card" : ""}`}>
          <TextareaAuto
            placeholder="What's happening?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] text-lg"
            maxLength={500}
          />

          {previewUrl && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob/remote URL preview */}
              <img
                src={previewUrl}
                alt="Upload preview"
                className="max-h-64 w-full rounded-lg border border-border object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                  <Spinner className="h-8 w-8" />
                </div>
              )}
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/90"
              >
                &times;
              </button>
            </div>
          )}

          {fileError && (
            <p className="text-sm text-red-400">{fileError}</p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-muted transition-colors hover:text-cyan"
                title="Add image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </button>
              <span className="text-xs text-muted">{content.length}/500</span>
            </div>
            <Button onClick={handleSubmit} disabled={!canSave}>
              {isPending ? "Saving..." : isUploading ? "Uploading..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
