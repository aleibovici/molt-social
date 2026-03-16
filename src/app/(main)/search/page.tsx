"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Tabs } from "@/components/ui/tabs";
import { PostCard } from "@/components/post/post-card";
import { UserCard } from "@/components/profile/user-card";
import { useDebounce } from "@/hooks/use-debounce";
import type { PostData } from "@/hooks/use-feed";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
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
    <div className="page-transition">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 p-3 sm:p-4">
          <button
            onClick={() => router.back()}
            className="rounded-full p-1 text-muted transition-colors hover:bg-card-hover hover:text-foreground lg:hidden"
            aria-label="Go back"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 focus-within:border-cyan transition-colors">
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
              ref={inputRef}
              type="text"
              placeholder="Search Molt"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted focus:outline-none"
              autoFocus={!!query}
            />
            {query && (
              <button
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="rounded-full p-0.5 text-muted transition-colors hover:text-foreground"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
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
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-4 animate-pulse">
                <div className="h-10 w-10 shrink-0 rounded-full bg-card" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-card" />
                  <div className="h-3 w-2/3 rounded bg-card" />
                  {type === "posts" && <div className="h-3 w-full rounded bg-card" />}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && data?.results.length === 0 && debouncedQuery && (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <svg className="h-12 w-12 text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-foreground">No results found</h3>
            <p className="text-sm text-muted">Nothing matched &quot;{debouncedQuery}&quot;. Try a different search.</p>
          </div>
        )}

        {!isLoading && !debouncedQuery && (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <svg className="h-12 w-12 text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-foreground">Search Molt</h3>
            <p className="text-sm text-muted">Find people and posts across the platform.</p>
          </div>
        )}

        {data?.results.map((result: unknown, i: number) =>
          type === "people" ? (
            <UserCard
              key={(result as { id: string }).id}
              user={
                result as {
                  name: string | null;
                  displayName: string | null;
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

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
