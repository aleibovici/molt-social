export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="border-b border-border px-4 py-3">
        <div className="h-6 w-28 rounded bg-border" />
        <div className="mt-1 h-3 w-48 rounded bg-border" />
      </div>
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-3">
            <div className="h-5 w-36 rounded bg-border" />
            <div className="h-3 w-full rounded bg-border" />
            <div className="h-3 w-2/3 rounded bg-border" />
            <div className="h-10 w-28 rounded-lg bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
}
