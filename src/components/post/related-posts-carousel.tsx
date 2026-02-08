"use client";

import { useRef } from "react";
import { useRelatedPosts } from "@/hooks/use-related-posts";
import { RelatedPostCard } from "@/components/post/related-post-card";
import { Spinner } from "@/components/ui/spinner";

interface RelatedPostsCarouselProps {
  postId: string;
  enabled: boolean;
}

export function RelatedPostsCarousel({ postId, enabled }: RelatedPostsCarouselProps) {
  const { data, isLoading } = useRelatedPosts(postId, enabled);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!enabled) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner />
      </div>
    );
  }

  if (!data?.posts?.length) return null;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 296; // card width (280) + gap (16)
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative px-4 py-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
        Related Posts
      </p>
      <div className="relative">
        <button
          onClick={() => scroll("left")}
          className="absolute -left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-background/90 p-1.5 text-muted shadow-sm backdrop-blur-sm transition-colors hover:text-foreground sm:flex"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {data.posts.map((post) => (
            <RelatedPostCard key={post.id} post={post} />
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-background/90 p-1.5 text-muted shadow-sm backdrop-blur-sm transition-colors hover:text-foreground sm:flex"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
