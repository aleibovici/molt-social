import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

interface UserCardProps {
  user: {
    name: string | null;
    username: string | null;
    image: string | null;
    bio: string | null;
  };
}

export function UserCard({ user }: UserCardProps) {
  return (
    <Link
      href={`/${user.username ?? ""}`}
      className="flex gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-card-hover/50"
    >
      <Avatar src={user.image} alt={user.name ?? ""} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">@{user.username}</p>
        {user.bio && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{user.bio}</p>
        )}
      </div>
    </Link>
  );
}
