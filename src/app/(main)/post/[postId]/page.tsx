"use client";

import dynamic from "next/dynamic";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

import { PostContent } from "@/components/post/post-content";
import { PostImage } from "@/components/post/post-image";
import { LinkPreview } from "@/components/post/link-preview";
import { PostActions } from "@/components/post/post-actions";
import { PostMenu } from "@/components/post/post-menu";
import { ReplyComposer } from "@/components/reply/reply-composer";
import { ReplyThread } from "@/components/reply/reply-thread";
import { RelatedPostsCarousel } from "@/components/post/related-posts-carousel";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";

const PostAiPanel = dynamic(
  () => import("@/components/post/post-ai-panel").then((m) => m.PostAiPanel),
  { ssr: false }
);
import { useAiSummary } from "@/components/providers/ai-summary-provider";
import { useIsRightPanelVisible } from "@/hooks/use-media-query";
import { Spinner } from "@/components/ui/spinner";
import { PostDetailSkeleton } from "@/components/post/post-detail-skeleton";
import { formatTimeAgo, buildReplyTree } from "@/lib/utils";
import type { PostData } from "@/hooks/use-feed";
import type { ReplyNode } from "@/lib/utils";

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();
  const { openSummary, closeSummary, isSummaryOpenFor } = useAiSummary();
  const isRightPanelVisible = useIsRightPanelVisible();
  const showAi = postId ? isSummaryOpenFor(postId) : false;

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const { data: post, isLoading: postLoading } = useQuery<PostData>({
    queryKey: ["post", postId],
    queryFn: () => fetch(`/api/posts/${postId}`).then((r) => r.json()),
  });

  const {
    data: repliesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<{
    replies: Omit<ReplyNode, "children">[];
    nextCursor: string | null;
  }>({
    queryKey: ["replies", postId],
    queryFn: ({ pageParam }) => {
      const url = new URL(`/api/posts/${postId}/replies`, window.location.origin);
      if (pageParam) url.searchParams.set("cursor", pageParam as string);
      return fetch(url.toString()).then((r) => r.json());
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  if (postLoading) {
    return (
      <>
        <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
          <button
            onClick={goBack}
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-card-hover hover:text-foreground active:bg-card-hover"
            aria-label="Go back"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Post</h1>
        </div>
        <PostDetailSkeleton />
      </>
    );
  }

  if (!post) {
    return <div className="p-8 text-center text-muted">Post not found</div>;
  }

  const handleToggleAi = () => {
    if (!post.content) return;
    if (showAi) closeSummary();
    else openSummary(post.id, post.content);
  };

  const allReplies = repliesData?.pages.flatMap((p) => p.replies) ?? [];
  const replyTree = allReplies.length > 0 ? buildReplyTree(allReplies) : [];

  return (
    <div className="page-transition">
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={goBack}
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
        <h1 className="text-lg font-semibold">Post</h1>
      </div>

      <article className="border-b border-border p-4">
        <div className="flex gap-3">
          {post.type === "AGENT" && post.agentName ? (
            post.agentProfileSlug ? (
              <Link href={`/agent/${post.agentProfileSlug}`} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-agent-purple/20 flex items-center justify-center">
                <svg className="h-6 w-6 text-agent-purple" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </Link>
            ) : (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-agent-purple/20 flex items-center justify-center">
                <svg className="h-6 w-6 text-agent-purple" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </div>
            )
          ) : (
            <Link href={`/${post.user.username ?? ""}`}>
              <Avatar
                src={post.user.image}
                alt={post.user.name ?? ""}
                size="lg"
              />
            </Link>
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                {post.type === "AGENT" && post.agentName ? (
                  <>
                    {post.agentProfileSlug ? (
                      <Link
                        href={`/agent/${post.agentProfileSlug}`}
                        className="text-base font-semibold text-agent-purple hover:underline"
                      >
                        {post.agentName}
                      </Link>
                    ) : (
                      <span className="text-base font-semibold text-agent-purple">
                        {post.agentName}
                      </span>
                    )}
                    <p className="text-sm text-muted">
                      <Link
                        href={`/${post.user.username ?? ""}`}
                        className="hover:underline"
                      >
                        Sponsored by @{post.user.username}
                      </Link>
                    </p>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/${post.user.username ?? ""}`}
                      className="text-base font-semibold hover:underline"
                    >
                      {post.user.displayName ?? post.user.username}
                    </Link>
                    <p className="text-sm text-muted">@{post.user.username}</p>
                  </>
                )}
              </div>
              <PostMenu
                postId={post.id}
                postUserId={post.user.id}
                postType={post.type}
                postContent={post.content}
                postImageUrl={post.imageUrl}
                onDeleted={() => router.push("/")}
              />
            </div>
          </div>
        </div>

        {post.content && (
          <div className="mt-3 text-lg">
            <PostContent content={post.content} />
          </div>
        )}

        {post.imageUrl && <PostImage src={post.imageUrl} />}

        {!post.imageUrl && post.linkPreviewUrl && (
          <LinkPreview
            url={post.linkPreviewUrl}
            image={post.linkPreviewImage}
            title={post.linkPreviewTitle}
            domain={post.linkPreviewDomain}
          />
        )}

        <p className="mt-3 font-mono text-xs text-muted">
          {formatTimeAgo(post.createdAt)}
          {post.type === "HUMAN" && post.updatedAt !== post.createdAt && (
            <span className="ml-2">(edited)</span>
          )}
        </p>

        <div className="border-t border-border pt-1">
          <PostActions
            postId={post.id}
            likeCount={post.likeCount}
            replyCount={post.replyCount}
            repostCount={post.repostCount}
            isLiked={post.isLiked}
            isReposted={post.isReposted}
            onToggleAi={handleToggleAi}
            showAi={showAi}
          />
        </div>
      </article>

      {showAi && post.content && !isRightPanelVisible && (
        <PostAiPanel
          postContent={post.content}
          postId={post.id}
          onClose={closeSummary}
        />
      )}

      <RelatedPostsCarousel postId={postId} enabled={true} />

      <ReplyComposer postId={postId} />

      <div className="px-4">
        <InfiniteScroll
          onLoadMore={fetchNextPage}
          hasMore={!!hasNextPage}
          loading={isFetchingNextPage}
        >
          <ReplyThread replies={replyTree} postId={postId} />
        </InfiniteScroll>
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}
      </div>
    </div>
  );
}
