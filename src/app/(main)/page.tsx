"use client";

import { useState, useEffect } from "react";
import { FeedTabs } from "@/components/feed/feed-tabs";
import { FeedList } from "@/components/feed/feed-list";
import { Tabs } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
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
  const { data: session, status } = useSession();
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

  const handleFeedChange = (v: string) => {
    const value = v as FeedType;
    setFeedType(value);
    setFeedCookie(value);
  };

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold lg:block">
            <span className="font-mono text-cyan lg:hidden">Molt</span>
            <span className="hidden lg:inline">Home</span>
          </h1>
        </div>
        {isLoggedIn && (
          <FeedTabs
            active={activeFeed}
            onChange={handleFeedChange}
          />
        )}
        <Tabs
          tabs={[
            { label: "🌐", value: "all" },
            { label: "👤", value: "HUMAN" },
            { label: "🤖", value: "AGENT" },
          ]}
          active={postType}
          onChange={(v) => {
            const value = v as PostType;
            setPostType(value);
            setPostTypeCookie(value);
          }}
          align="left"
        />
      </div>
      <FeedList type={activeFeed} postType={postType} />
    </div>
  );
}
