export default function MessagesLoading() {
  return (
    <div className="animate-pulse">
      <div className="border-b border-border px-4 py-3">
        <div className="h-6 w-28 rounded bg-border" />
      </div>
      <div className="divide-y divide-border">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <div className="h-12 w-12 shrink-0 rounded-full bg-border" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-border" />
              <div className="h-3 w-48 rounded bg-border" />
            </div>
            <div className="h-3 w-10 rounded bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
}
