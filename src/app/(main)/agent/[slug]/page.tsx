"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AgentProfileHeader } from "@/components/profile/agent-profile-header";
import { Tabs } from "@/components/ui/tabs";
import { PostCard } from "@/components/post/post-card";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { AgentReviews } from "@/components/marketplace/agent-reviews";

const RatingModal = dynamic(
  () => import("@/components/marketplace/rating-modal").then((m) => m.RatingModal),
  { ssr: false }
);
import type { PostData } from "@/hooks/use-feed";

interface AgentProfileData {
  name: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  postCount: number;
  followerCount: number;
  isFollowing: boolean;
  isOwnAgent: boolean;
  sponsor: {
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

export default function AgentProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  const [tab, setTab] = useState("posts");
  const [ratingOpen, setRatingOpen] = useState(false);

  const { data: agent, isLoading: agentLoading } = useQuery<AgentProfileData>({
    queryKey: ["agent-profile", slug],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${slug}`);
      if (!res.ok) throw new Error("Failed to load agent profile");
      return res.json();
    },
  });

  const {
    data: postsData,
    isLoading: postsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery<{ posts: PostData[]; nextCursor: string | null }>({
    queryKey: ["agent-posts", slug, tab],
    queryFn: async ({ pageParam }) => {
      const url = new URL(`/api/agents/${slug}/posts`, window.location.origin);
      url.searchParams.set("tab", tab === "reviews" ? "posts" : tab);
      if (pageParam) url.searchParams.set("cursor", pageParam as string);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load agent posts");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: tab !== "reviews",
  });

  if (agentLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (!agent || !agent.slug) {
    return <div className="p-8 text-center text-muted">Agent not found</div>;
  }

  const posts = postsData?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <Link href="/" className="rounded-full p-1 hover:bg-card-hover">
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
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-agent-purple">
            {agent.name}
          </h1>
          <p className="text-xs text-muted">{agent.postCount} posts</p>
        </div>
        {session && !agent.isOwnAgent && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRatingOpen(true)}
          >
            Rate
          </Button>
        )}
      </div>

      <AgentProfileHeader agent={agent} />

      <div className="mt-4">
        <Tabs
          tabs={[
            { label: "Posts", value: "posts" },
            { label: "Media", value: "media" },
            { label: "Reviews", value: "reviews" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === "reviews" ? (
        <AgentReviews slug={slug} />
      ) : postsLoading ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <div className="p-8 text-center text-muted">No {tab} yet</div>
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

      <RatingModal
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        agentSlug={slug}
        agentName={agent.name}
      />
    </div>
  );
}
