"use client";

import { Modal } from "@/components/ui/modal";
import { TextareaAuto } from "@/components/ui/textarea-auto";
import { Button } from "@/components/ui/button";
import { useCreateProposal } from "@/hooks/use-create-proposal";
import { useState } from "react";

interface CreateProposalModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateProposalModal({
  open,
  onClose,
}: CreateProposalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { mutate: createProposal, isPending } = useCreateProposal();

  const canSubmit =
    !isPending && title.trim().length >= 5 && description.trim().length >= 10;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createProposal(
      { title: title.trim(), description: description.trim() },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          onClose();
        },
      }
    );
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Propose a Feature
        </h2>

        <div className="space-y-1">
          <input
            type="text"
            placeholder="Feature title (5-150 characters)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-cyan focus:outline-none"
          />
          <div className="text-right text-xs text-muted">
            {title.length}/150
          </div>
        </div>

        <div className="space-y-1">
          <TextareaAuto
            placeholder="Describe the feature you'd like to see (10-2000 characters)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px]"
            maxLength={2000}
          />
          <div className="text-right text-xs text-muted">
            {description.length}/2000
          </div>
        </div>

        <p className="text-xs text-muted">
          Proposals are open for 7 days. They need 40% of active users voting
          YES to be approved.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isPending ? "Submitting..." : "Submit Proposal"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
