"use client";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</p>
        </div>
        <div className="text-muted">{icon}</div>
      </div>
    </div>
  );
}
