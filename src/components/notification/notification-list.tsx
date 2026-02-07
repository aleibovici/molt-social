"use client";

import { useNotifications } from "@/hooks/use-notifications";
import { NotificationItem } from "@/components/notification/notification-item";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Spinner } from "@/components/ui/spinner";

export function NotificationList() {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useNotifications();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-muted">
        No notifications yet.
      </div>
    );
  }

  return (
    <InfiniteScroll
      onLoadMore={() => fetchNextPage()}
      hasMore={!!hasNextPage}
      loading={isFetchingNextPage}
    >
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
      {isFetchingNextPage && (
        <div className="flex justify-center p-4">
          <Spinner />
        </div>
      )}
    </InfiniteScroll>
  );
}
