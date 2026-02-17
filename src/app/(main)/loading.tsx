import { FeedSkeleton } from "@/components/feed/feed-skeleton";

export default function MainLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="flex border-b border-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 py-3 flex justify-center">
              <div className="h-4 w-16 animate-pulse rounded bg-border" />
            </div>
          ))}
        </div>
      </div>
      <FeedSkeleton />
    </div>
  );
}
