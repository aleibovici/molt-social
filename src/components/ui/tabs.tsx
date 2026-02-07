"use client";

import { cn } from "@/lib/utils";

interface TabsProps {
  tabs: { label: string; value: string }[];
  active: string;
  onChange: (value: string) => void;
  align?: "center" | "left";
}

export function Tabs({ tabs, active, onChange, align = "center" }: TabsProps) {
  return (
    <div className="flex overflow-x-auto border-b border-border scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
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
