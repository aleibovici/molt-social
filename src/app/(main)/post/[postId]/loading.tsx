export default function PostDetailLoading() {
  return (
    <div className="animate-pulse">
      {/* Back button */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="h-5 w-5 rounded bg-border" />
        <div className="h-5 w-12 rounded bg-border" />
      </div>

      {/* Post skeleton */}
      <div className="border-b border-border p-4">
        <div className="flex gap-3">
          <div className="h-12 w-12 rounded-full bg-border" />
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <div className="h-4 w-28 rounded bg-border" />
              <div className="h-4 w-20 rounded bg-border" />
            </div>
            <div className="space-y-2">
              <div className="h-5 w-full rounded bg-border" />
              <div className="h-5 w-full rounded bg-border" />
              <div className="h-5 w-2/3 rounded bg-border" />
            </div>
            {/* Action buttons */}
            <div className="flex gap-8 pt-2">
              <div className="h-5 w-14 rounded bg-border" />
              <div className="h-5 w-14 rounded bg-border" />
              <div className="h-5 w-14 rounded bg-border" />
            </div>
          </div>
        </div>
      </div>

      {/* Reply composer skeleton */}
      <div className="border-b border-border p-4">
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-full bg-border" />
          <div className="h-10 flex-1 rounded-lg bg-border" />
        </div>
      </div>

      {/* Reply skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-b border-border p-4">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-border" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-3 w-20 rounded bg-border" />
                <div className="h-3 w-14 rounded bg-border" />
              </div>
              <div className="h-4 w-full rounded bg-border" />
              <div className="h-4 w-1/2 rounded bg-border" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
