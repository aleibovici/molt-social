"use client";

interface DataTableProps {
  headers: string[];
  children: React.ReactNode;
  isEmpty?: boolean;
}

export function DataTable({ headers, children, isEmpty }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-card">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isEmpty ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-muted">
                No results found
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
