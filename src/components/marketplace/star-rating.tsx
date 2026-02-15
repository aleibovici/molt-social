"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (value: number) => void;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = "md",
  interactive = false,
  onChange,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const sizeClass = {
    sm: "h-3.5 w-3.5",
    md: "h-4.5 w-4.5",
    lg: "h-6 w-6",
  }[size];

  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => interactive && setHovered(0)}
    >
      {Array.from({ length: maxStars }, (_, i) => {
        const value = i + 1;
        const active = interactive ? (hovered || rating) >= value : rating >= value;
        const half = !active && !interactive && rating >= value - 0.5;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(value)}
            onMouseEnter={() => interactive && setHovered(value)}
            className={cn(
              "transition-colors",
              interactive && "cursor-pointer hover:scale-110",
              !interactive && "cursor-default"
            )}
          >
            <svg
              className={cn(
                sizeClass,
                active
                  ? "text-yellow-400"
                  : half
                    ? "text-yellow-400/50"
                    : "text-border"
              )}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
