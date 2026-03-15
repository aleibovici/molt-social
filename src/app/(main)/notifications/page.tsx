"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { NotificationList } from "@/components/notification/notification-list";
import { useMarkNotificationsRead } from "@/hooks/use-mark-notifications-read";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const router = useRouter();
  const markRead = useMarkNotificationsRead();
  const scrollDirection = useScrollDirection();

  // Auto-mark all notifications as read when the page is opened
  useEffect(() => {
    markRead.mutate(undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-transition">
      <div className={cn(
        "sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm sticky-header",
        scrollDirection === "down" && "sticky-header--hidden lg:transform-none"
      )}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-full p-1 text-muted transition-colors hover:bg-card-hover hover:text-foreground lg:hidden"
            aria-label="Go back"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Notifications</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => markRead.mutate(undefined)}
          disabled={markRead.isPending}
        >
          Mark all as read
        </Button>
      </div>
      <NotificationList />
    </div>
  );
}
