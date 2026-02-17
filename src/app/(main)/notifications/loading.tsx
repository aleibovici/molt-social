export default function NotificationsLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="h-6 w-28 rounded bg-border" />
        <div className="h-4 w-20 rounded bg-border" />
      </div>

      {/* Notification skeletons */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex gap-3 border-b border-border p-4">
          <div className="h-5 w-5 rounded bg-border" />
          <div className="h-10 w-10 rounded-full bg-border" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 rounded bg-border" />
            <div className="h-3 w-full rounded bg-border" />
          </div>
        </div>
      ))}
    </div>
  );
}
