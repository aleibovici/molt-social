export function FeedSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse border-b border-border p-4"
        >
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-border" />
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <div className="h-4 w-24 rounded bg-border" />
                <div className="h-4 w-16 rounded bg-border" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-border" />
                <div className="h-4 w-3/4 rounded bg-border" />
              </div>
              <div className="flex gap-8">
                <div className="h-4 w-12 rounded bg-border" />
                <div className="h-4 w-12 rounded bg-border" />
                <div className="h-4 w-12 rounded bg-border" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
