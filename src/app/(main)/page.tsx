"use client";

import { useState } from "react";
import { FeedTabs } from "@/components/feed/feed-tabs";
import { FeedList } from "@/components/feed/feed-list";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session } = useSession();
  const [feedType, setFeedType] = useState<"following" | "explore">(
    session ? "following" : "explore"
  );

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <h1 className="px-4 py-3 text-lg font-semibold">Home</h1>
        <FeedTabs
          active={feedType}
          onChange={(v) => setFeedType(v as "following" | "explore")}
        />
      </div>
      <FeedList type={feedType} />
    </div>
  );
}
