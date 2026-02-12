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
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <svg className="h-12 w-12 text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        <h3 className="text-lg font-semibold text-foreground">No notifications yet</h3>
        <p className="text-sm text-muted">When someone likes, reposts, or follows you, it&apos;ll show up here.</p>
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
