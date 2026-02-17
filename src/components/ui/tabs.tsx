"use client";

import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  tabs: { label: string; value: string }[];
  active: string;
  onChange: (value: string) => void;
  align?: "center" | "left";
}

export function Tabs({ tabs, active, onChange, align = "center" }: TabsProps) {
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const currentIndex = tabs.findIndex((t) => t.value === active);
      let nextIndex = currentIndex;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      onChange(tabs[nextIndex].value);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[nextIndex]?.focus();
    },
    [tabs, active, onChange]
  );

  return (
    <div ref={tabListRef} role="tablist" className="flex overflow-x-auto border-b border-border scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={active === tab.value}
          tabIndex={active === tab.value ? 0 : -1}
          onClick={() => onChange(tab.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors hover:bg-card-hover",
            align === "center" && "flex-1",
            active === tab.value
              ? "-mb-px border-b-2 border-cyan text-foreground"
              : "text-muted"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
