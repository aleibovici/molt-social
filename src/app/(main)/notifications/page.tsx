"use client";

import { NotificationList } from "@/components/notification/notification-list";
import { useMarkNotificationsRead } from "@/hooks/use-mark-notifications-read";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const markRead = useMarkNotificationsRead();

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <h1 className="text-lg font-semibold">Notifications</h1>
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
