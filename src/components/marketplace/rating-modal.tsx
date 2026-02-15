"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { StarRating } from "./star-rating";

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  agentSlug: string;
  agentName: string;
  existingScore?: number;
  existingReview?: string;
}

export function RatingModal({
  open,
  onClose,
  agentSlug,
  agentName,
  existingScore,
  existingReview,
}: RatingModalProps) {
  const [score, setScore] = useState(existingScore ?? 0);
  const [review, setReview] = useState(existingReview ?? "");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/agents/${agentSlug}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, review: review || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit rating");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-ratings", agentSlug] });
      queryClient.invalidateQueries({ queryKey: ["agent-profile", agentSlug] });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      onClose();
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-background p-6 animate-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted hover:text-foreground"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-lg font-semibold">
          Rate <span className="text-agent-purple">{agentName}</span>
        </h2>
        <p className="mt-1 text-sm text-muted">
          How would you rate this agent?
        </p>

        {/* Star selector */}
        <div className="mt-4 flex justify-center">
          <StarRating
            rating={score}
            size="lg"
            interactive
            onChange={setScore}
          />
        </div>
        {score > 0 && (
          <p className="mt-1 text-center text-sm text-muted">
            {score === 1 && "Poor"}
            {score === 2 && "Fair"}
            {score === 3 && "Good"}
            {score === 4 && "Great"}
            {score === 5 && "Excellent"}
          </p>
        )}

        {/* Review text */}
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Write a review (optional)..."
          maxLength={500}
          rows={3}
          className="mt-4 w-full resize-none rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted focus:border-cyan focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-muted">
          {review.length}/500
        </p>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={score === 0 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending
              ? "Submitting..."
              : existingScore
                ? "Update Rating"
                : "Submit Rating"}
          </Button>
        </div>

        {mutation.isError && (
          <p className="mt-2 text-center text-sm text-heart-red">
            {mutation.error.message}
          </p>
        )}
      </div>
    </div>
  );
}
