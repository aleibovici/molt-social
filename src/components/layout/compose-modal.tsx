"use client";

import { Modal } from "@/components/ui/modal";
import { TextareaAuto } from "@/components/ui/textarea-auto";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "next-auth/react";
import { useCreatePost } from "@/hooks/use-create-post";
import { useUploadImage } from "@/hooks/use-upload-image";
import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/toast";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface ComposeModalProps {
  open: boolean;
  onClose: () => void;
}

export function ComposeModal({ open, onClose }: ComposeModalProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const { mutate: createPost, isPending } = useCreatePost();
  const { toast } = useToast();
  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();

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

      // Show local preview immediately
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const localUrl = URL.createObjectURL(file);
      blobUrlRef.current = localUrl;
      setPreviewUrl(localUrl);
      setImageUrl("");

      // Start uploading
      uploadImage(file, {
        onSuccess: (url) => {
          setImageUrl(url);
          URL.revokeObjectURL(localUrl);
          blobUrlRef.current = null;
        },
        onError: (err) => {
          setFileError(err.message);
          setPreviewUrl("");
          setImageUrl("");
          URL.revokeObjectURL(localUrl);
          blobUrlRef.current = null;
        },
      });
    },
    [uploadImage]
  );

  const removeImage = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPreviewUrl("");
    setImageUrl("");
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Revoke any outstanding blob URL when the component unmounts
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const handleSubmit = () => {
    if (!content.trim() && !imageUrl) return;
    if (isPending) return;
    createPost(
      {
        content: content.trim() || undefined,
        imageUrl: imageUrl || undefined,
      },
      {
        onSuccess: () => {
          setContent("");
          removeImage();
          onClose();
          toast("Post created");
        },
        onError: (err) => {
          toast(err.message || "Failed to create post", "error");
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

  const canPost = !isPending && !isUploading && (!!content.trim() || !!imageUrl);

  return (
    <Modal open={open} onClose={onClose} mobileFullScreen>
      <div
        className="flex gap-2 sm:gap-3"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="hidden sm:block">
          <Avatar src={session?.user?.image} alt={session?.user?.name ?? ""} />
        </div>
        <div className={`flex-1 space-y-3 ${isDragging ? "rounded-lg ring-2 ring-cyan ring-offset-2 ring-offset-card" : ""}`}>
          <TextareaAuto
            placeholder="What's happening?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] text-base sm:min-h-[100px] sm:text-lg"
            maxLength={500}
          />

          {previewUrl && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob URL preview, not optimizable */}
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
                aria-label="Remove image"
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
                aria-label="Add image"
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
              <span
                className={`text-xs ${
                  content.length >= 500
                    ? "text-red-400 font-medium"
                    : content.length >= 450
                      ? "text-yellow-400"
                      : "text-muted"
                }`}
                role="status"
                aria-live="polite"
                aria-label={`${500 - content.length} characters remaining`}
              >
                {content.length}/500
              </span>
            </div>
            <Button onClick={handleSubmit} disabled={!canPost}>
              {isPending ? "Posting..." : isUploading ? "Uploading..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
