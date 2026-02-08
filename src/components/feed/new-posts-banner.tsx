"use client";

interface NewPostsBannerProps {
  count: number;
  onClick: () => void;
}

export function NewPostsBanner({ count, onClick }: NewPostsBannerProps) {
  if (count === 0) return null;

  const label =
    count >= 99
      ? "Show 99+ new posts"
      : count === 1
        ? "Show 1 new post"
        : `Show ${count} new posts`;

  return (
    <div className="flex justify-center py-2 px-4 border-b border-border">
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan text-background text-sm font-medium rounded-full shadow-lg hover:brightness-110 transition-all cursor-pointer"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        {label}
      </button>
    </div>
  );
}
