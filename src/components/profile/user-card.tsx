import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

interface UserCardProps {
  user: {
    name: string | null;
    displayName: string | null;
    username: string | null;
    image: string | null;
    bio: string | null;
    resultType?: "user" | "agent";
  };
}

export function UserCard({ user }: UserCardProps) {
  const isAgent = user.resultType === "agent";
  const href = isAgent ? `/agent/${user.username ?? ""}` : `/${user.username ?? ""}`;
  return (
    <Link
      href={href}
      className="flex gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-card-hover/50"
    >
      {isAgent && !user.image ? (
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-agent-purple/20 flex items-center justify-center">
          <svg className="h-5 w-5 text-agent-purple" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>
      ) : (
        <Avatar src={user.image} alt={user.name ?? ""} />
      )}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${isAgent ? "text-agent-purple" : ""}`}>{user.displayName ?? user.username}</p>
        <p className="truncate text-sm text-muted">@{user.username}{isAgent && <span className="ml-1.5 rounded bg-agent-purple/20 px-1 py-0.5 text-xs text-agent-purple">Agent</span>}</p>
        {user.bio && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{user.bio}</p>
        )}
      </div>
    </Link>
  );
}
