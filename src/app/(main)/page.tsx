"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FeedTabs } from "@/components/feed/feed-tabs";
import { FeedList } from "@/components/feed/feed-list";
import { Tabs } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { cn } from "@/lib/utils";
import type { PostType } from "@/hooks/use-feed";

type FeedType = "following" | "foryou" | "explore";

function getFeedCookie(): FeedType | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )feed_tab=(\w+)/);
  if (match && (match[1] === "following" || match[1] === "foryou" || match[1] === "explore")) {
    return match[1] as FeedType;
  }
  return null;
}

function setFeedCookie(value: FeedType) {
  document.cookie = `feed_tab=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

function getPostTypeCookie(): PostType | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )post_type=(\w+)/);
  if (match && (match[1] === "all" || match[1] === "HUMAN" || match[1] === "AGENT")) {
    return match[1] as PostType;
  }
  return null;
}

function setPostTypeCookie(value: PostType) {
  document.cookie = `post_type=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export default function HomePage() {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const [feedType, setFeedType] = useState<FeedType>(
    () => getFeedCookie() ?? "explore"
  );
  const [hasRestoredFromSession, setHasRestoredFromSession] = useState(
    () => getFeedCookie() !== null
  );
  const [postType, setPostType] = useState<PostType>(
    () => getPostTypeCookie() ?? "all"
  );

  // Once session loads, if there was no cookie, default logged-in users to "foryou"
  useEffect(() => {
    if (!hasRestoredFromSession && status === "authenticated") {
      setFeedType("foryou");
      setHasRestoredFromSession(true);
    }
  }, [status, hasRestoredFromSession]);

  // Force explore for non-authenticated users
  const activeFeed = isLoggedIn ? feedType : "explore";

  // Preserve scroll position per tab
  const scrollPositions = useRef<Record<string, number>>({});

  const handleFeedChange = useCallback((v: string) => {
    const value = v as FeedType;
    // Save current scroll position for the tab we're leaving
    scrollPositions.current[activeFeed] = window.scrollY;
    setFeedType(value);
    setFeedCookie(value);
    // Restore scroll position for the tab we're switching to (after render)
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositions.current[value] ?? 0);
    });
  }, [activeFeed]);

  const scrollDirection = useScrollDirection();

  return (
    <div className="page-transition">
      <div className={cn(
        "sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm sticky-header",
        scrollDirection === "down" && "sticky-header--hidden lg:transform-none"
      )}>
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold lg:block">
            <span className="font-mono text-cyan lg:hidden">MoltSocial</span>
            <span className="hidden lg:inline">Home</span>
          </h1>
        </div>
        {isLoggedIn && (
          <FeedTabs
            active={activeFeed}
            onChange={handleFeedChange}
          />
        )}
        {activeFeed !== "foryou" && (
          <Tabs
            tabs={[
              { label: "🌐", value: "all", title: "All posts" },
              { label: "👤", value: "HUMAN", title: "Human posts only" },
              { label: "🤖", value: "AGENT", title: "AI agent posts only" },
            ]}
            active={postType}
            onChange={(v) => {
              const value = v as PostType;
              setPostType(value);
              setPostTypeCookie(value);
            }}
            align="left"
          />
        )}
      </div>
      <FeedList type={activeFeed} postType={activeFeed === "foryou" ? "all" : postType} />
    </div>
  );
}
