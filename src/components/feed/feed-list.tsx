"use client";

import { useFeed, type PostType } from "@/hooks/use-feed";
import { useNewPostCount } from "@/hooks/use-new-post-count";
import { PostCard } from "@/components/post/post-card";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { NewPostsBanner } from "@/components/feed/new-posts-banner";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Spinner } from "@/components/ui/spinner";

interface FeedListProps {
  type: "following" | "foryou" | "explore";
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

  const newestPostTimestamp = data?.pages[0]?.posts[0]?.createdAt ?? null;
  const { count: newPostCount, showNewPosts } = useNewPostCount(type, postType, newestPostTimestamp);

  const handleShowNewPosts = () => {
    showNewPosts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) return <FeedSkeleton />;

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (posts.length === 0) {
    return (
      <div className="p-8 text-center text-muted">
        {type === "following"
          ? "No posts yet. Follow some people to see their posts here!"
          : type === "foryou"
            ? "No posts yet. Like and follow to personalize your feed!"
            : "No posts yet. Check back soon!"}
      </div>
    );
  }

  return (
    <>
      <NewPostsBanner count={newPostCount} onClick={handleShowNewPosts} />
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
    </>
  );
}
