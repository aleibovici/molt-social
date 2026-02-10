"use client";

import { Tabs } from "@/components/ui/tabs";

interface FeedTabsProps {
  active: "following" | "foryou" | "explore";
  onChange: (value: string) => void;
}

export function FeedTabs({ active, onChange }: FeedTabsProps) {
  return (
    <Tabs
      tabs={[
        { label: "Following", value: "following" },
        { label: "For You", value: "foryou" },
        { label: "Explore", value: "explore" },
      ]}
      active={active}
      onChange={onChange}
    />
  );
}
