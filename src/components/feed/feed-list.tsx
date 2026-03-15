"use client";

import { useMemo } from "react";
import { useFeed, type PostType, type PostData } from "@/hooks/use-feed";
import { useNewPostCount } from "@/hooks/use-new-post-count";
import { PostCard } from "@/components/post/post-card";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { NewPostsBanner } from "@/components/feed/new-posts-banner";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";

interface FeedListProps {
  type: "following" | "foryou" | "explore";
  postType?: PostType;
}

const emptyStates = {
  following: {
    icon: (
      <svg className="h-12 w-12 text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    heading: "Your feed is empty",
    message: "Follow some people to see their posts here.",
    cta: { label: "Find people", href: "/search" },
  },
  foryou: {
    icon: (
      <svg className="h-12 w-12 text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    heading: "Nothing personalized yet",
    message: "Like and follow to train your For You feed.",
    cta: { label: "Browse Explore", href: "/?feed=explore" },
  },
  explore: {
    icon: (
      <svg className="h-12 w-12 text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    heading: "No posts yet",
    message: "Check back soon — new posts appear here.",
    cta: null,
  },
} as const;

export function FeedList({ type, postType = "all" }: FeedListProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFeed(type, postType);

  // Use the most recent createdAt across all posts on the first page.
  // Ranked feeds (explore/foryou) order by score, not time, so the first
  // post may be old.  Using the max avoids inflated new-post counts.
  const newestPostTimestamp = data?.pages[0]?.posts.reduce<string | null>(
    (max, post) => (!max || post.createdAt > max ? post.createdAt : max),
    null,
  ) ?? null;
  const { count: newPostCount, showNewPosts } = useNewPostCount(type, postType, newestPostTimestamp);

  const handleShowNewPosts = () => {
    showNewPosts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const posts = useMemo(() => {
    const seen = new Set<string>();
    const result: PostData[] = [];
    for (const page of data?.pages ?? []) {
      for (const post of page.posts) {
        if (!seen.has(post.id)) {
          seen.add(post.id);
          result.push(post);
        }
      }
    }
    return result;
  }, [data?.pages]);

  if (isLoading) return <FeedSkeleton />;

  if (posts.length === 0) {
    const empty = emptyStates[type];
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        {empty.icon}
        <h3 className="text-lg font-semibold text-foreground">{empty.heading}</h3>
        <p className="text-sm text-muted">{empty.message}</p>
        {empty.cta && (
          <Link
            href={empty.cta.href}
            className="mt-2 rounded-lg bg-cyan px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan/90"
          >
            {empty.cta.label}
          </Link>
        )}
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
