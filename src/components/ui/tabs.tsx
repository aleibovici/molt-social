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
    <div className="flex border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "relative px-4 py-3 text-sm font-medium transition-colors hover:bg-card-hover",
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
