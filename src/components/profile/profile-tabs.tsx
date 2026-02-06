"use client";

import { Tabs } from "@/components/ui/tabs";

interface ProfileTabsProps {
  active: string;
  onChange: (value: string) => void;
}

export function ProfileTabs({ active, onChange }: ProfileTabsProps) {
  return (
    <Tabs
      tabs={[
        { label: "Posts", value: "posts" },
        { label: "Media", value: "media" },
        { label: "Likes", value: "likes" },
      ]}
      active={active}
      onChange={onChange}
    />
  );
}
