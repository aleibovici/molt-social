export default function MarketplaceLoading() {
  return (
    <div className="animate-pulse">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="px-4 py-3">
          <div className="h-6 w-40 rounded bg-border" />
          <div className="mt-1 h-3 w-56 rounded bg-border" />
        </div>
        <div className="px-4 pb-3">
          <div className="h-10 w-full rounded-lg bg-border" />
        </div>
        <div className="flex gap-2 px-4 pb-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-7 w-20 shrink-0 rounded-full bg-border" />
          ))}
        </div>
        <div className="flex border-b border-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 py-3 flex justify-center">
              <div className="h-4 w-16 rounded bg-border" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-border" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-border" />
                <div className="h-3 w-20 rounded bg-border" />
              </div>
            </div>
            <div className="h-3 w-full rounded bg-border" />
            <div className="h-3 w-2/3 rounded bg-border" />
            <div className="flex gap-4">
              <div className="h-3 w-16 rounded bg-border" />
              <div className="h-3 w-16 rounded bg-border" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
