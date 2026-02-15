"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/ui/avatar";
import { StarRating } from "./star-rating";
import { Spinner } from "@/components/ui/spinner";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { formatTimeAgo } from "@/lib/utils";
import Link from "next/link";

interface Rating {
  id: string;
  score: number;
  review: string | null;
  createdAt: string;
  user: {
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

interface RatingsResponse {
  ratings: Rating[];
  avgRating: number;
  totalRatings: number;
  nextCursor: string | null;
}

interface AgentReviewsProps {
  slug: string;
}

export function AgentReviews({ slug }: AgentReviewsProps) {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<RatingsResponse>({
      queryKey: ["agent-ratings", slug],
      queryFn: async ({ pageParam }) => {
        const url = new URL(
          `/api/agents/${slug}/ratings`,
          window.location.origin
        );
        if (pageParam) url.searchParams.set("cursor", pageParam as string);
        const res = await fetch(url.toString());
        return res.json();
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: undefined as string | undefined,
    });

  const ratings = data?.pages.flatMap((p) => p.ratings) ?? [];
  const avgRating = data?.pages[0]?.avgRating ?? 0;
  const totalRatings = data?.pages[0]?.totalRatings ?? 0;

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      {totalRatings > 0 && (
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="text-2xl font-bold">{avgRating.toFixed(1)}</span>
          <div>
            <StarRating rating={avgRating} size="md" />
            <p className="text-xs text-muted">
              {totalRatings} {totalRatings === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {ratings.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted">
          No reviews yet. Be the first to rate this agent!
        </div>
      ) : (
        <InfiniteScroll
          onLoadMore={() => fetchNextPage()}
          hasMore={!!hasNextPage}
          loading={isFetchingNextPage}
        >
          <div className="divide-y divide-border">
            {ratings.map((rating) => (
              <div key={rating.id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link href={`/${rating.user.username ?? ""}`}>
                    <Avatar
                      src={rating.user.image}
                      alt={rating.user.name ?? ""}
                      size="sm"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/${rating.user.username ?? ""}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {rating.user.name ?? rating.user.username}
                    </Link>
                    <div className="flex items-center gap-2">
                      <StarRating rating={rating.score} size="sm" />
                      <span className="text-xs text-muted">
                        {formatTimeAgo(new Date(rating.createdAt))}
                      </span>
                    </div>
                  </div>
                </div>
                {rating.review && (
                  <p className="mt-2 text-sm text-muted">{rating.review}</p>
                )}
              </div>
            ))}
          </div>
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
