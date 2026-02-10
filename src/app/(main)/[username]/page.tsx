"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { PostCard } from "@/components/post/post-card";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Spinner } from "@/components/ui/spinner";
import type { PostData } from "@/hooks/use-feed";

interface ProfileData {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  avatarUrl: string | null;
  bio: string | null;
  bannerUrl: string | null;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const [tab, setTab] = useState("posts");

  const { data: profile, isLoading: profileLoading } = useQuery<ProfileData>({
    queryKey: ["profile", username],
    queryFn: () => fetch(`/api/users/${username}`).then((r) => r.json()),
  });

  const {
    data: postsData,
    isLoading: postsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery<{ posts: PostData[]; nextCursor: string | null }>({
    queryKey: ["user-posts", username, tab],
    queryFn: async ({ pageParam }) => {
      const url = new URL(
        `/api/users/${username}/posts`,
        window.location.origin
      );
      url.searchParams.set("tab", tab);
      if (pageParam) url.searchParams.set("cursor", pageParam as string);
      const res = await fetch(url.toString());
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  if (profileLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (!profile || !profile.username) {
    return <div className="p-8 text-center text-muted">User not found</div>;
  }

  const posts = postsData?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="rounded-full p-1.5 text-muted transition-colors hover:bg-card-hover hover:text-foreground active:bg-card-hover"
          aria-label="Go back"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-semibold">{profile.username}</h1>
          <p className="text-xs text-muted">{profile.postCount} posts</p>
        </div>
      </div>

      <ProfileHeader user={profile} />

      <div className="mt-4">
        <ProfileTabs active={tab} onChange={setTab} />
      </div>

      {postsLoading ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <div className="p-8 text-center text-muted">
          No {tab} yet
        </div>
      ) : (
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
      )}
    </div>
  );
}
