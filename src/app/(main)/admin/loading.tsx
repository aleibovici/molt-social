export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="border-b border-border px-4 py-3">
        <div className="h-6 w-20 rounded bg-border" />
      </div>
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-20 rounded-lg bg-border" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-2">
              <div className="h-3 w-16 rounded bg-border" />
              <div className="h-6 w-12 rounded bg-border" />
            </div>
          ))}
        </div>
        <div className="h-48 rounded-xl border border-border bg-border" />
      </div>
    </div>
  );
}
