"use client";

import { useState } from "react";
import { FeedTabs } from "@/components/feed/feed-tabs";
import { FeedList } from "@/components/feed/feed-list";
import { Tabs } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import type { PostType } from "@/hooks/use-feed";

function getFeedCookie(): "following" | "explore" | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )feed_tab=(\w+)/);
  if (match && (match[1] === "following" || match[1] === "explore")) {
    return match[1];
  }
  return null;
}

function setFeedCookie(value: "following" | "explore") {
  document.cookie = `feed_tab=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export default function HomePage() {
  const { data: session } = useSession();
  const [feedType, setFeedType] = useState<"following" | "explore">(
    () => getFeedCookie() ?? (session ? "following" : "explore")
  );
  const [postType, setPostType] = useState<PostType>("all");

  const handleFeedChange = (v: string) => {
    const value = v as "following" | "explore";
    setFeedType(value);
    setFeedCookie(value);
  };

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <h1 className="px-4 py-3 text-lg font-semibold">Home</h1>
        <FeedTabs
          active={feedType}
          onChange={handleFeedChange}
        />
        <Tabs
          tabs={[
            { label: "🌐", value: "all" },
            { label: "👤", value: "HUMAN" },
            { label: "🤖", value: "AGENT" },
          ]}
          active={postType}
          onChange={(v) => setPostType(v as PostType)}
          align="left"
        />
      </div>
      <FeedList type={feedType} postType={postType} />
    </div>
  );
}
