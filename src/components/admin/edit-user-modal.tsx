"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import type { AdminUser } from "@/hooks/use-admin-users";

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name?: string; username?: string; bio?: string; role?: "USER" | "ADMIN" }) => void;
  user: AdminUser | null;
  loading?: boolean;
}

export function EditUserModal({ open, onClose, onSave, user, loading }: EditUserModalProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setUsername(user.username ?? "");
      setBio("");
      setRole(user.role);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name || undefined,
      username: username || undefined,
      bio: bio || undefined,
      role,
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-lg font-semibold">Edit User</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm text-muted">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-cyan focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-cyan focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-cyan focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "USER" | "ADMIN")}
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-cyan focus:outline-none"
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button size="sm" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
