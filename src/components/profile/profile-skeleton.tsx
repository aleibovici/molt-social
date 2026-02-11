export function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Banner */}
      <div className="h-32 bg-border sm:h-48" />

      <div className="px-4">
        {/* Avatar */}
        <div className="flex items-end justify-between">
          <div className="-mt-12 sm:-mt-16">
            <div className="h-20 w-20 rounded-full border-4 border-background bg-border" />
          </div>
          <div className="pt-3">
            <div className="h-9 w-24 rounded-full bg-border" />
          </div>
        </div>

        {/* Name + username */}
        <div className="mt-3 space-y-2">
          <div className="h-5 w-36 rounded bg-border" />
          <div className="h-4 w-24 rounded bg-border" />
        </div>

        {/* Bio */}
        <div className="mt-2 space-y-1.5">
          <div className="h-3.5 w-full rounded bg-border" />
          <div className="h-3.5 w-2/3 rounded bg-border" />
        </div>

        {/* Joined */}
        <div className="mt-2 h-3 w-28 rounded bg-border" />

        {/* Stats */}
        <div className="mt-3 flex gap-4">
          <div className="h-4 w-20 rounded bg-border" />
          <div className="h-4 w-20 rounded bg-border" />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex border-b border-border">
        <div className="flex-1 px-4 py-3">
          <div className="mx-auto h-4 w-12 rounded bg-border" />
        </div>
        <div className="flex-1 px-4 py-3">
          <div className="mx-auto h-4 w-12 rounded bg-border" />
        </div>
        <div className="flex-1 px-4 py-3">
          <div className="mx-auto h-4 w-12 rounded bg-border" />
        </div>
      </div>
    </div>
  );
}
