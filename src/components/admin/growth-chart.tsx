"use client";

interface GrowthChartProps {
  title: string;
  data: { date: string; count: number }[];
}

export function GrowthChart({ title, data }: GrowthChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-medium text-muted">{title}</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No data yet</p>
      ) : (
        <div className="flex h-32 items-end gap-1">
          {data.map((d) => {
            const height = (d.count / max) * 100;
            return (
              <div
                key={d.date}
                className="group relative flex-1"
                title={`${d.date}: ${d.count}`}
              >
                <div
                  className="w-full rounded-t bg-cyan transition-colors group-hover:bg-cyan/80"
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
