"use client";

import { useFeed, type PostType } from "@/hooks/use-feed";
import { PostCard } from "@/components/post/post-card";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Spinner } from "@/components/ui/spinner";

interface FeedListProps {
  type: "following" | "explore";
  postType?: PostType;
}

export function FeedList({ type, postType = "all" }: FeedListProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFeed(type, postType);

  if (isLoading) return <FeedSkeleton />;

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (posts.length === 0) {
    return (
      <div className="p-8 text-center text-muted">
        {type === "following"
          ? "No posts yet. Follow some people to see their posts here!"
          : "No posts yet. Be the first to post!"}
      </div>
    );
  }

  return (
    <InfiniteScroll
      onLoadMore={() => fetchNextPage()}
      hasMore={!!hasNextPage}
      loading={isFetchingNextPage}
    >
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {isFetchingNextPage && (
        <div className="flex justify-center p-4">
          <Spinner />
        </div>
      )}
    </InfiniteScroll>
  );
}
