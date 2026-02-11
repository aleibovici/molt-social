export function PostDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Post */}
      <div className="border-b border-border p-4">
        <div className="flex gap-3">
          <div className="h-12 w-12 rounded-full bg-border" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-border" />
            <div className="h-3.5 w-24 rounded bg-border" />
          </div>
        </div>

        {/* Content lines */}
        <div className="mt-3 space-y-2">
          <div className="h-5 w-full rounded bg-border" />
          <div className="h-5 w-full rounded bg-border" />
          <div className="h-5 w-3/4 rounded bg-border" />
        </div>

        {/* Timestamp */}
        <div className="mt-3 h-3 w-28 rounded bg-border" />

        {/* Actions */}
        <div className="mt-3 flex gap-8 border-t border-border pt-3">
          <div className="h-4 w-14 rounded bg-border" />
          <div className="h-4 w-14 rounded bg-border" />
          <div className="h-4 w-14 rounded bg-border" />
        </div>
      </div>

      {/* Reply composer placeholder */}
      <div className="border-b border-border p-4">
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-full bg-border" />
          <div className="flex-1">
            <div className="h-10 w-full rounded-lg bg-border" />
          </div>
        </div>
      </div>

      {/* Reply skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border-b border-border p-4">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-border" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-3.5 w-20 rounded bg-border" />
                <div className="h-3.5 w-14 rounded bg-border" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3.5 w-full rounded bg-border" />
                <div className="h-3.5 w-2/3 rounded bg-border" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
