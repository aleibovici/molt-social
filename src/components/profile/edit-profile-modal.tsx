"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  currentDisplayName: string | null;
  currentUsername: string;
  currentImage: string | null;
  currentAvatarUrl: string | null;
}

export function EditProfileModal({
  open,
  onClose,
  currentDisplayName,
  currentUsername,
  currentImage,
  currentAvatarUrl,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(currentDisplayName ?? "");
  const [username, setUsername] = useState(currentUsername);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    currentAvatarUrl ?? currentImage
  );
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [hasCustomAvatar, setHasCustomAvatar] = useState(!!currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { update } = useSession();
  const router = useRouter();

  const refreshAfterAvatarChange = async () => {
    await update();
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so re-selecting the same file triggers onChange
    e.target.value = "";

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError("Use JPEG, PNG, GIF, or WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("File too large. Maximum 5 MB.");
      return;
    }

    setAvatarError("");
    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/users/me/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setAvatarError(data.error || "Upload failed");
        return;
      }

      const { avatarUrl } = await res.json();
      setAvatarPreview(avatarUrl);
      setHasCustomAvatar(true);
      await refreshAfterAvatarChange();
      toast("Avatar updated!");
    } catch {
      setAvatarError("Upload failed. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarError("");
    setAvatarUploading(true);

    try {
      const res = await fetch("/api/users/me/avatar", { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        setAvatarError(data.error || "Failed to remove avatar");
        return;
      }

      setAvatarPreview(currentImage);
      setHasCustomAvatar(false);
      await refreshAfterAvatarChange();
      toast("Avatar removed!");
    } catch {
      setAvatarError("Failed to remove avatar. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName || undefined, username }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409) {
          setError("Username already taken");
        } else {
          setError(data.error || "Something went wrong");
        }
        return;
      }

      const updated = await res.json();

      await update();
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      toast("Profile updated!");
      onClose();

      if (updated.username !== currentUsername) {
        router.push(`/${updated.username}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="mb-4 text-lg font-semibold">Edit profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar section */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <Avatar src={avatarPreview} alt={displayName || ""} size="xl" />
            {avatarUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={avatarUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload avatar
            </Button>
            {hasCustomAvatar && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={avatarUploading}
                onClick={handleAvatarRemove}
              >
                Remove
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          {avatarError && (
            <p className="text-xs text-heart-red">{avatarError}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Display name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan"
            maxLength={50}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Username</label>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2">
            <span className="text-muted">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
              }
              placeholder="username"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted focus:outline-none"
              maxLength={20}
              minLength={3}
            />
          </div>
          {error && <p className="mt-1 text-xs text-heart-red">{error}</p>}
          <p className="mt-1 text-xs text-muted">
            3-20 characters. Letters, numbers, and underscores only.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || username.length < 3}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
