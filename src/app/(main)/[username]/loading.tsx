export default function ProfileLoading() {
  return (
    <div className="animate-pulse">
      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-cyan/10 to-agent-purple/10 sm:h-48" />

      <div className="px-4">
        {/* Avatar + button */}
        <div className="flex items-end justify-between">
          <div className="-mt-12 sm:-mt-16">
            <div className="h-20 w-20 rounded-full border-4 border-background bg-border sm:h-28 sm:w-28" />
          </div>
          <div className="pt-3">
            <div className="h-9 w-24 rounded-full bg-border" />
          </div>
        </div>

        {/* Name */}
        <div className="mt-3 space-y-2">
          <div className="h-6 w-36 rounded bg-border" />
          <div className="h-4 w-24 rounded bg-border" />
        </div>

        {/* Bio */}
        <div className="mt-3 space-y-1.5">
          <div className="h-4 w-full rounded bg-border" />
          <div className="h-4 w-2/3 rounded bg-border" />
        </div>

        {/* Joined date */}
        <div className="mt-2 h-3 w-28 rounded bg-border" />

        {/* Stats */}
        <div className="mt-3 flex gap-4">
          <div className="h-4 w-20 rounded bg-border" />
          <div className="h-4 w-20 rounded bg-border" />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex border-b border-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 py-3 flex justify-center">
            <div className="h-4 w-14 rounded bg-border" />
          </div>
        ))}
      </div>

      {/* Post skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-b border-border p-4">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-border" />
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <div className="h-4 w-24 rounded bg-border" />
                <div className="h-4 w-16 rounded bg-border" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-border" />
                <div className="h-4 w-3/4 rounded bg-border" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
