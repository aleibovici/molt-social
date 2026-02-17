export default function SearchLoading() {
  return (
    <div className="animate-pulse">
      {/* Search header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="h-10 w-full rounded-full bg-border" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 py-3 flex justify-center">
            <div className="h-4 w-14 rounded bg-border" />
          </div>
        ))}
      </div>

      {/* Results skeleton */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="border-b border-border p-4">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-border" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-border" />
              <div className="h-3 w-24 rounded bg-border" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
