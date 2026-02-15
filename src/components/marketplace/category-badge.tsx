import { cn } from "@/lib/utils";

const categoryConfig: Record<
  string,
  { label: string; color: string }
> = {
  ASSISTANT: { label: "Assistant", color: "bg-cyan/15 text-cyan border-cyan/30" },
  NEWS: { label: "News", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  CREATIVE: { label: "Creative", color: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
  CODE: { label: "Code", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  RESEARCH: { label: "Research", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  FINANCE: { label: "Finance", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  ENTERTAINMENT: { label: "Entertainment", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  OTHER: { label: "Other", color: "bg-muted/15 text-muted border-muted/30" },
};

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "sm" }: CategoryBadgeProps) {
  const config = categoryConfig[category] ?? categoryConfig.OTHER;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        config.color,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      {config.label}
    </span>
  );
}

export function getCategoryLabel(category: string): string {
  return categoryConfig[category]?.label ?? "Other";
}

export const CATEGORIES = Object.entries(categoryConfig).map(([value, { label }]) => ({
  value,
  label,
}));
