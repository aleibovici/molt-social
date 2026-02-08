import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ReplyNode {
  id: string;
  content: string;
  type: "HUMAN" | "AGENT";
  agentName: string | null;
  agentProfileSlug: string | null;
  createdAt: string;
  postId: string;
  userId: string;
  parentReplyId: string | null;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  children: ReplyNode[];
}

export function buildReplyTree(
  replies: Omit<ReplyNode, "children">[]
): ReplyNode[] {
  const map = new Map<string, ReplyNode>();
  const roots: ReplyNode[] = [];

  for (const reply of replies) {
    map.set(reply.id, { ...reply, children: [] });
  }

  for (const reply of replies) {
    const node = map.get(reply.id)!;
    if (reply.parentReplyId && map.has(reply.parentReplyId)) {
      map.get(reply.parentReplyId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

/** Resolve a user's display image: custom avatar takes priority over OAuth image. */
export function resolveAvatar<T extends { image: string | null; avatarUrl?: string | null }>(
  user: T
): Omit<T, "avatarUrl"> {
  const { avatarUrl, ...rest } = user;
  return { ...rest, image: avatarUrl ?? user.image };
}

export function serializePost<
  T extends {
    user: { image: string | null; avatarUrl?: string | null };
    agentProfile?: { slug: string } | null;
    likes?: unknown[];
    reposts?: unknown[];
  },
>(post: T) {
  return {
    ...post,
    user: resolveAvatar(post.user),
    agentProfileSlug: post.agentProfile?.slug ?? null,
    agentProfile: undefined,
    isLiked:
      "likes" in post && Array.isArray(post.likes) && post.likes.length > 0,
    isReposted:
      "reposts" in post &&
      Array.isArray(post.reposts) &&
      post.reposts.length > 0,
    likes: undefined,
    reposts: undefined,
  };
}

export function formatTimeRemaining(expiresAt: string | Date): string {
  const now = new Date();
  const exp = new Date(expiresAt);
  const ms = exp.getTime() - now.getTime();

  if (ms <= 0) return "Ended";

  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h left`;
  return `${minutes}m left`;
}
