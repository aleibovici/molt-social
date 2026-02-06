"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  currentName: string | null;
  currentUsername: string;
}

export function EditProfileModal({
  open,
  onClose,
  currentName,
  currentUsername,
}: EditProfileModalProps) {
  const [name, setName] = useState(currentName ?? "");
  const [username, setUsername] = useState(currentUsername);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { update } = useSession();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, username }),
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
        <div>
          <label className="mb-1 block text-sm text-muted">Display name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
