"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { NotificationData } from "@/hooks/use-notifications";

const typeConfig = {
  LIKE: {
    icon: (
      <svg className="h-4 w-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
    action: "liked your post",
  },
  REPOST: {
    icon: (
      <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    action: "reposted your post",
  },
  REPLY: {
    icon: (
      <svg className="h-4 w-4 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    action: "replied to your post",
  },
  REPLY_TO_REPLY: {
    icon: (
      <svg className="h-4 w-4 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    action: "replied to your reply",
  },
  FOLLOW: {
    icon: (
      <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    action: "followed you",
  },
};

function getHref(notification: NotificationData): string {
  if (notification.type === "FOLLOW") {
    return `/${notification.actor.username}`;
  }
  if (notification.reply) {
    return `/post/${notification.reply.postId}`;
  }
  if (notification.postId) {
    return `/post/${notification.postId}`;
  }
  return "/";
}

function getPreview(notification: NotificationData): string | null {
  if (notification.reply?.content) {
    return notification.reply.content.length > 80
      ? notification.reply.content.slice(0, 80) + "..."
      : notification.reply.content;
  }
  if (notification.post?.content) {
    return notification.post.content.length > 80
      ? notification.post.content.slice(0, 80) + "..."
      : notification.post.content;
  }
  return null;
}

export function NotificationItem({ notification }: { notification: NotificationData }) {
  const config = typeConfig[notification.type];
  const href = getHref(notification);
  const preview = getPreview(notification);

  return (
    <Link
      href={href}
      className={cn(
        "flex gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-card-hover",
        !notification.read && "bg-cyan/5"
      )}
    >
      <div className="mt-1 shrink-0">{config.icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Avatar src={notification.actor.image} alt={notification.actor.name ?? ""} size="sm" />
          <div className="min-w-0 flex-1">
            <span className="font-medium text-foreground">
              {notification.actor.name ?? notification.actor.username}
            </span>{" "}
            <span className="text-muted">{config.action}</span>
          </div>
          <span className="shrink-0 text-xs text-muted">
            {formatTimeAgo(notification.createdAt)}
          </span>
        </div>
        {preview && (
          <p className="mt-1 truncate text-sm text-muted">{preview}</p>
        )}
      </div>
    </Link>
  );
}
