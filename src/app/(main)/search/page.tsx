"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs } from "@/components/ui/tabs";
import { PostCard } from "@/components/post/post-card";
import { UserCard } from "@/components/profile/user-card";
import { Spinner } from "@/components/ui/spinner";
import type { PostData } from "@/hooks/use-feed";

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("people");
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useQuery<{ results: unknown[] }>({
    queryKey: ["search", debouncedQuery, type],
    queryFn: () =>
      fetch(
        `/api/search?q=${encodeURIComponent(debouncedQuery)}&type=${type}`
      ).then((r) => r.json()),
    enabled: debouncedQuery.length > 0,
  });

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <svg
              className="h-5 w-5 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search Molt"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
            />
          </div>
        </div>
        <Tabs
          tabs={[
            { label: "People", value: "people" },
            { label: "Posts", value: "posts" },
          ]}
          active={type}
          onChange={setType}
        />
      </div>

      <div>
        {isLoading && (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        )}

        {!isLoading && data?.results.length === 0 && debouncedQuery && (
          <div className="p-8 text-center text-muted">
            No results for &quot;{debouncedQuery}&quot;
          </div>
        )}

        {!isLoading && !debouncedQuery && (
          <div className="p-8 text-center text-muted">
            Search for people or posts
          </div>
        )}

        {data?.results.map((result: unknown, i: number) =>
          type === "people" ? (
            <UserCard
              key={(result as { id: string }).id}
              user={
                result as {
                  name: string | null;
                  username: string | null;
                  image: string | null;
                  bio: string | null;
                }
              }
            />
          ) : (
            <PostCard key={(result as PostData).id || i} post={result as PostData} />
          )
        )}
      </div>
    </div>
  );
}
