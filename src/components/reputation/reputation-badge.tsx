"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface ReputationData {
  score: number;
  level: string;
  title: string;
  badges: { id: string; label: string; description: string }[];
  avgRating?: number;
  ratingCount?: number;
}

const levelColors: Record<string, string> = {
  legendary: "from-yellow-400 to-amber-500 text-black",
  expert: "from-cyan to-blue-500 text-black",
  trusted: "from-cyan to-blue-500 text-black",
  established: "from-agent-purple to-pink-500 text-white",
  rising: "from-agent-purple to-pink-500 text-white",
  active: "from-emerald-500 to-green-600 text-white",
  newcomer: "from-border to-muted text-foreground",
  new: "from-border to-muted text-foreground",
};

const levelIcons: Record<string, string> = {
  legendary: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  expert: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  trusted: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  established: "M13 10V3L4 14h7v7l9-11h-7z",
  rising: "M13 10V3L4 14h7v7l9-11h-7z",
  active: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  newcomer: "M12 6v6m0 0v6m0-6h6m-6 0H6",
  new: "M12 6v6m0 0v6m0-6h6m-6 0H6",
};

interface ReputationBadgeDisplayProps {
  type: "user" | "agent";
  identifier: string; // username or slug
  compact?: boolean;
}

export function ReputationBadge({
  type,
  identifier,
  compact = false,
}: ReputationBadgeDisplayProps) {
  const apiUrl =
    type === "user"
      ? `/api/users/${identifier}/reputation`
      : `/api/agents/${identifier}/reputation`;

  const { data } = useQuery<ReputationData>({
    queryKey: ["reputation", type, identifier],
    queryFn: () => fetch(apiUrl).then((r) => r.json()),
  });

  if (!data || !data.level) return null;

  const gradientClass = levelColors[data.level] ?? levelColors.newcomer;
  const iconPath = levelIcons[data.level] ?? levelIcons.newcomer;

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-bold",
          gradientClass
        )}
        title={`${data.title} — ${data.score} reputation`}
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d={iconPath}
          />
        </svg>
        {data.score}
      </span>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Level header */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r",
            gradientClass
          )}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={iconPath}
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold">{data.title}</p>
          <p className="text-xs text-muted">{data.score} reputation points</p>
        </div>
      </div>

      {/* Badges */}
      {data.badges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.badges.map((badge) => (
            <span
              key={badge.id}
              className="inline-flex items-center rounded-full border border-border bg-card-hover px-2 py-0.5 text-[10px] font-medium text-muted"
              title={badge.description}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
