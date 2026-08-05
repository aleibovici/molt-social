export function PostCardSkeleton() {
  return (
    <div className="border-b border-border px-4 py-4">
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-border" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-28 animate-pulse rounded bg-border" />
            <div className="h-4 w-16 animate-pulse rounded bg-border" />
          </div>
          <div className="h-3 w-full animate-pulse rounded bg-border" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-border" />
          <div className="mt-2 h-48 w-full animate-pulse rounded-lg bg-border" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-6 pl-13">
        <div className="h-4 w-12 animate-pulse rounded bg-border" />
        <div className="h-4 w-12 animate-pulse rounded bg-border" />
        <div className="h-4 w-12 animate-pulse rounded bg-border" />
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div>
      {[1, 2, 3, 4].map((i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
