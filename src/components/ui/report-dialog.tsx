"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useReport } from "@/hooks/use-report";

type ReportReason = "AI_IMPERSONATION" | "SPAM" | "HARASSMENT" | "OTHER";

const REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: "AI_IMPERSONATION",
    label: "AI impersonation",
    description: "This account appears to be an AI pretending to be human",
  },
  {
    value: "SPAM",
    label: "Spam",
    description: "Repetitive, unsolicited, or promotional content",
  },
  {
    value: "HARASSMENT",
    label: "Harassment",
    description: "Abusive, threatening, or targeted behavior",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Another issue not listed above",
  },
];

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  targetPostId?: string;
  targetReplyId?: string;
  targetUserId?: string;
}

export function ReportDialog({
  open,
  onClose,
  targetPostId,
  targetReplyId,
  targetUserId,
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const report = useReport();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  useEffect(() => {
    if (!open) {
      setReason(null);
      setDetails("");
      setSubmitted(false);
      report.reset();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const handleSubmit = () => {
    if (!reason) return;
    report.mutate(
      {
        reason,
        details: details.trim() || undefined,
        targetPostId,
        targetReplyId,
        targetUserId,
      },
      {
        onSuccess: () => setSubmitted(true),
      }
    );
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" onClick={onClose} />
        <div className="animate-in relative z-10 w-full max-w-sm rounded-xl border border-border bg-background p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Report submitted
          </h3>
          <p className="mt-2 text-sm text-muted">
            Thanks for helping keep the community safe. We&apos;ll review this
            report.
          </p>
          <div className="mt-6 flex justify-end">
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="animate-in relative z-10 w-full max-w-sm rounded-xl border border-border bg-background p-6">
        <h3 className="text-lg font-semibold text-foreground">
          Report content
        </h3>
        <p className="mt-1 text-sm text-muted">
          Why are you reporting this?
        </p>

        <div className="mt-4 space-y-2">
          {REASONS.map((r) => (
            <label
              key={r.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                reason === r.value
                  ? "border-cyan bg-cyan/5"
                  : "border-border hover:bg-card-hover/50"
              }`}
            >
              <input
                type="radio"
                name="report-reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="mt-0.5 accent-cyan"
              />
              <div>
                <span className="text-sm font-medium text-foreground">
                  {r.label}
                </span>
                <p className="text-xs text-muted">{r.description}</p>
              </div>
            </label>
          ))}
        </div>

        <textarea
          placeholder="Additional details (optional)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={500}
          className="mt-3 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-muted focus:border-cyan focus:outline-none"
          rows={2}
        />

        {report.isError && (
          <p className="mt-2 text-sm text-red-400">{report.error.message}</p>
        )}

        <div className="mt-4 flex justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={report.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleSubmit}
            disabled={!reason || report.isPending}
          >
            {report.isPending ? "Submitting..." : "Submit report"}
          </Button>
        </div>
      </div>
    </div>
  );
}
