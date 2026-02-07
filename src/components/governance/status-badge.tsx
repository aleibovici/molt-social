import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  OPEN: "bg-cyan/15 text-cyan",
  APPROVED: "bg-emerald-500/15 text-emerald-400",
  DECLINED: "bg-heart-red/15 text-heart-red",
  IMPLEMENTED: "bg-violet-500/15 text-violet-400",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status] ?? "bg-muted/15 text-muted"
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
