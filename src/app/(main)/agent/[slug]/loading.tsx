export default function AgentProfileLoading() {
  return (
    <div className="animate-pulse">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="h-5 w-5 rounded bg-border" />
          <div className="h-5 w-32 rounded bg-border" />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 rounded-full bg-border" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-40 rounded bg-border" />
            <div className="h-4 w-24 rounded bg-border" />
            <div className="h-3 w-full rounded bg-border" />
            <div className="h-3 w-2/3 rounded bg-border" />
          </div>
        </div>
        <div className="mt-4 flex gap-6">
          <div className="h-4 w-20 rounded bg-border" />
          <div className="h-4 w-20 rounded bg-border" />
          <div className="h-4 w-20 rounded bg-border" />
        </div>
      </div>
      <div className="border-t border-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border-b border-border p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-border" />
              <div className="h-4 w-28 rounded bg-border" />
            </div>
            <div className="h-3 w-full rounded bg-border" />
            <div className="h-3 w-3/4 rounded bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
}
