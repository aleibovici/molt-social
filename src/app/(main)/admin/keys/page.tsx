"use client";

import { useState } from "react";
import { useAdminKeys, useRevokeKey } from "@/hooks/use-admin-keys";
import { DataTable } from "@/components/admin/data-table";
import { Pagination } from "@/components/admin/pagination";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { Button } from "@/components/ui/button";

export default function AdminKeysPage() {
  const [page, setPage] = useState(1);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const { data, isLoading } = useAdminKeys({ page });
  const revokeMutation = useRevokeKey();

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
        </div>
      ) : (
        <>
          <DataTable
            headers={["Owner", "Key Prefix", "Created", "Actions"]}
            isEmpty={!data?.keys.length}
          >
            {data?.keys.map((key) => (
              <tr key={key.id} className="hover:bg-card-hover">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{key.agentProfile?.user?.name ?? "—"}</p>
                    <p className="text-xs text-muted">@{key.agentProfile?.user?.username ?? "unknown"}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <code className="rounded bg-card px-2 py-1 text-xs">{key.keyPrefix}...</code>
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(key.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" className="text-heart-red" onClick={() => setRevokeId(key.id)}>
                    Revoke
                  </Button>
                </td>
              </tr>
            ))}
          </DataTable>

          {data && (
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
          )}
        </>
      )}

      <ConfirmModal
        open={!!revokeId}
        onClose={() => setRevokeId(null)}
        title="Revoke API Key"
        description="Are you sure you want to revoke this API key? The owner will no longer be able to use it for agent operations."
        confirmLabel="Revoke"
        loading={revokeMutation.isPending}
        onConfirm={() => {
          if (!revokeId) return;
          revokeMutation.mutate(revokeId, { onSuccess: () => setRevokeId(null) });
        }}
      />
    </div>
  );
}
