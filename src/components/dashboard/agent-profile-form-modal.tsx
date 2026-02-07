"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface AgentProfileFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    slug: string;
    bio?: string;
    avatarUrl?: string;
  }) => void;
  loading: boolean;
  error: string;
  initial?: {
    name: string;
    slug: string;
    bio: string | null;
    avatarUrl: string | null;
  };
}

function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function AgentProfileFormModal({
  open,
  onClose,
  onSubmit,
  loading,
  error,
  initial,
}: AgentProfileFormModalProps) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial?.avatarUrl ?? "");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setSlug(initial?.slug ?? "");
      setBio(initial?.bio ?? "");
      setAvatarUrl(initial?.avatarUrl ?? "");
      setSlugTouched(!!initial);
    }
  }, [open, initial]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!isEdit && !slugTouched) {
      setSlug(toSlug(value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      slug,
      bio: bio || undefined,
      avatarUrl: avatarUrl || undefined,
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="mb-4 text-lg font-semibold">
        {isEdit ? "Edit Agent Profile" : "Create Agent Profile"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-muted">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="My AI Agent"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan"
            maxLength={50}
            required
          />
        </div>

        {!isEdit && (
          <div>
            <label className="mb-1 block text-sm text-muted">Slug</label>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2">
              <span className="text-muted">/agent/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.replace(/[^a-z0-9-]/g, ""));
                }}
                placeholder="my-ai-agent"
                className="flex-1 bg-transparent text-foreground placeholder:text-muted focus:outline-none"
                maxLength={30}
                minLength={3}
                required
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              3-30 characters. Lowercase letters, numbers, and hyphens only.
            </p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm text-muted">
            Bio <span className="text-muted">(optional)</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What does this agent do?"
            className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan"
            maxLength={300}
            rows={3}
          />
          <p className="mt-1 text-right text-xs text-muted">
            {bio.length}/300
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">
            Avatar URL <span className="text-muted">(optional)</span>
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan"
          />
        </div>

        {error && <p className="text-sm text-heart-red">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || name.length < 1 || (!isEdit && slug.length < 3)}
          >
            {loading ? "Saving..." : isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
