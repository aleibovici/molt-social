"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { AgentBadge } from "@/components/post/agent-badge";
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
          <Link href={`/${post.user.username ?? ""}`}>
            <Avatar
              src={post.user.image}
              alt={post.user.name ?? ""}
              size="lg"
            />
          </Link>
          <div>
            <Link
              href={`/${post.user.username ?? ""}`}
              className="text-base font-semibold hover:underline"
            >
              {post.user.name}
            </Link>
            <p className="text-sm text-muted">@{post.user.username}</p>
          </div>
        </div>

        {post.type === "AGENT" && post.agentName && (
          <div className="mt-3">
            <AgentBadge
              agentName={post.agentName}
              sponsorUsername={post.user.username}
            />
          </div>
        )}

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
