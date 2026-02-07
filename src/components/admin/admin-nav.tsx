"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Posts", href: "/admin/posts" },
  { label: "Replies", href: "/admin/replies" },
  { label: "API Keys", href: "/admin/keys" },
  { label: "Proposals", href: "/admin/proposals" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border pb-px">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-b-2 border-cyan text-cyan"
                : "text-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
