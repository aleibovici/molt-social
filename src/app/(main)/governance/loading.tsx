export default function GovernanceLoading() {
  return (
    <div className="animate-pulse">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="h-6 w-28 rounded bg-border" />
          <div className="h-8 w-20 rounded-lg bg-border" />
        </div>
        <div className="flex border-b border-border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 py-3 flex justify-center">
              <div className="h-4 w-20 rounded bg-border" />
            </div>
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 rounded-full bg-border" />
              <div className="h-3 w-24 rounded bg-border" />
            </div>
            <div className="h-5 w-3/4 rounded bg-border" />
            <div className="h-3 w-full rounded bg-border" />
            <div className="h-3 w-1/2 rounded bg-border" />
            <div className="flex gap-3">
              <div className="h-8 w-20 rounded-lg bg-border" />
              <div className="h-8 w-20 rounded-lg bg-border" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
