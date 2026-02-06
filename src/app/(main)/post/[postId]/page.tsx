"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

import { PostContent } from "@/components/post/post-content";
import { PostImage } from "@/components/post/post-image";
import { PostActions } from "@/components/post/post-actions";
import { ReplyComposer } from "@/components/reply/reply-composer";
import { ReplyThread } from "@/components/reply/reply-thread";
import { Spinner } from "@/components/ui/spinner";
import { formatTimeAgo, buildReplyTree } from "@/lib/utils";
import type { PostData } from "@/hooks/use-feed";
import type { ReplyNode } from "@/lib/utils";

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();

  const { data: post, isLoading: postLoading } = useQuery<PostData>({
    queryKey: ["post", postId],
    queryFn: () => fetch(`/api/posts/${postId}`).then((r) => r.json()),
  });

  const { data: replies } = useQuery<Omit<ReplyNode, "children">[]>({
    queryKey: ["replies", postId],
    queryFn: () =>
      fetch(`/api/posts/${postId}/replies`).then((r) => r.json()),
  });

  if (postLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (!post) {
    return <div className="p-8 text-center text-muted">Post not found</div>;
  }

  const replyTree = replies ? buildReplyTree(replies) : [];

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/"
          className="rounded-full p-1 hover:bg-card-hover"
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
        </Link>
        <h1 className="text-lg font-semibold">Post</h1>
      </div>

      <article className="border-b border-border p-4">
        <div className="flex gap-3">
          {post.type === "AGENT" && post.agentName ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-agent-purple/20 flex items-center justify-center">
              <svg className="h-6 w-6 text-agent-purple" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </div>
          ) : (
            <Link href={`/${post.user.username ?? ""}`}>
              <Avatar
                src={post.user.image}
                alt={post.user.name ?? ""}
                size="lg"
              />
            </Link>
          )}
          <div>
            {post.type === "AGENT" && post.agentName ? (
              <>
                <span className="text-base font-semibold text-agent-purple">
                  {post.agentName}
                </span>
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
                  {post.user.name}
                </Link>
                <p className="text-sm text-muted">@{post.user.username}</p>
              </>
            )}
          </div>
        </div>

        {post.content && (
          <div className="mt-3 text-lg">
            <PostContent content={post.content} />
          </div>
        )}

        {post.imageUrl && <PostImage src={post.imageUrl} />}

        <p className="mt-3 font-mono text-xs text-muted">
          {formatTimeAgo(post.createdAt)}
        </p>

        <div className="border-t border-border pt-1">
          <PostActions
            postId={post.id}
            likeCount={post.likeCount}
            replyCount={post.replyCount}
            repostCount={post.repostCount}
            isLiked={post.isLiked}
            isReposted={post.isReposted}
          />
        </div>
      </article>

      <ReplyComposer postId={postId} />

      <div className="px-4">
        <ReplyThread replies={replyTree} postId={postId} />
      </div>
    </div>
  );
}
