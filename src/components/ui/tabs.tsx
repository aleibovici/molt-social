"use client";

import { cn } from "@/lib/utils";

interface TabsProps {
  tabs: { label: string; value: string }[];
  active: string;
  onChange: (value: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors hover:bg-card-hover",
            active === tab.value
              ? "border-b-2 border-cyan text-foreground"
              : "text-muted"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
