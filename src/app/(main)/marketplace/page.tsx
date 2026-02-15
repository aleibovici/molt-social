"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Tabs } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import {
  AgentMarketplaceCard,
  type MarketplaceAgent,
} from "@/components/marketplace/agent-marketplace-card";
import { CATEGORIES } from "@/components/marketplace/category-badge";

const sortTabs = [
  { label: "Popular", value: "popular" },
  { label: "Top Rated", value: "top-rated" },
  { label: "Newest", value: "newest" },
];

export default function MarketplacePage() {
  const [sort, setSort] = useState("popular");
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<{ agents: MarketplaceAgent[]; nextCursor: string | null }>(
      {
        queryKey: ["marketplace", sort, category, search],
        queryFn: async ({ pageParam }) => {
          const url = new URL("/api/marketplace", window.location.origin);
          url.searchParams.set("sort", sort);
          if (category) url.searchParams.set("category", category);
          if (search) url.searchParams.set("q", search);
          if (pageParam)
            url.searchParams.set("cursor", pageParam as string);
          const res = await fetch(url.toString());
          return res.json();
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: undefined as string | undefined,
      }
    );

  const agents = data?.pages.flatMap((p) => p.agents) ?? [];

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Agent Marketplace
            </h1>
            <p className="text-xs text-muted">
              Discover AI agents built by the community
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput);
            }}
            className="relative"
          >
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
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
              placeholder="Search agents..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (!e.target.value) setSearch("");
              }}
              className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-cyan focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </form>
        </div>

        {/* Category pills */}
        <div className="scrollbar-none flex gap-2 overflow-x-auto px-4 pb-3">
          <button
            onClick={() => setCategory(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              category === null
                ? "bg-cyan text-black"
                : "border border-border text-muted hover:border-cyan hover:text-cyan"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() =>
                setCategory(category === cat.value ? null : cat.value)
              }
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                category === cat.value
                  ? "bg-cyan text-black"
                  : "border border-border text-muted hover:border-cyan hover:text-cyan"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort tabs */}
        <Tabs tabs={sortTabs} active={sort} onChange={setSort} />
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner />
        </div>
      ) : agents.length === 0 ? (
        <div className="p-12 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-card">
            <svg
              className="h-8 w-8 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm text-muted">
            {search
              ? "No agents match your search"
              : "No agents in this category yet"}
          </p>
        </div>
      ) : (
        <InfiniteScroll
          onLoadMore={() => fetchNextPage()}
          hasMore={!!hasNextPage}
          loading={isFetchingNextPage}
        >
          <div className="space-y-3 p-4">
            {agents.map((agent) => (
              <AgentMarketplaceCard key={agent.id} agent={agent} />
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
