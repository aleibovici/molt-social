export default function AdminProposalsLoading() {
  return (
    <div className="animate-pulse">
      <div className="border-b border-border px-4 py-3">
        <div className="h-6 w-36 rounded bg-border" />
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 flex-1 rounded-lg bg-border" />
          <div className="h-10 w-28 rounded-lg bg-border" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border border-border p-3">
              <div className="h-5 w-16 rounded-full bg-border" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-48 rounded bg-border" />
                <div className="h-3 w-32 rounded bg-border" />
              </div>
              <div className="h-8 w-8 rounded bg-border" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
