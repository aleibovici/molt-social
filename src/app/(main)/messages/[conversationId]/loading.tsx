export default function ConversationLoading() {
  return (
    <div className="flex h-full flex-col animate-pulse">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded bg-border" />
          <div className="h-10 w-10 rounded-full bg-border" />
          <div className="h-4 w-24 rounded bg-border" />
        </div>
      </div>
      <div className="flex-1 space-y-3 p-4">
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-full bg-border" />
          <div className="h-16 w-48 rounded-2xl bg-border" />
        </div>
        <div className="flex flex-row-reverse gap-2">
          <div className="h-8 w-8 rounded-full bg-border" />
          <div className="h-10 w-36 rounded-2xl bg-border" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-full bg-border" />
          <div className="h-12 w-56 rounded-2xl bg-border" />
        </div>
      </div>
    </div>
  );
}
