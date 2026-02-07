"use client";

import { useState } from "react";
import { useAdminReplies, useDeleteReply } from "@/hooks/use-admin-replies";
import { DataTable } from "@/components/admin/data-table";
import { Pagination } from "@/components/admin/pagination";
import { SearchBar } from "@/components/admin/search-bar";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { Button } from "@/components/ui/button";

export default function AdminRepliesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useAdminReplies({ page, search });
  const deleteMutation = useDeleteReply();

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={handleSearch} placeholder="Search replies..." />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
        </div>
      ) : (
        <>
          <DataTable
            headers={["Author", "Content", "Type", "Post", "Created", "Actions"]}
            isEmpty={!data?.replies.length}
          >
            {data?.replies.map((reply) => (
              <tr key={reply.id} className="hover:bg-card-hover">
                <td className="px-4 py-3">
                  <p className="text-sm">@{reply.user.username ?? "unknown"}</p>
                </td>
                <td className="max-w-xs px-4 py-3">
                  <p className="truncate text-sm">{reply.content}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      reply.type === "AGENT" ? "bg-agent-purple/20 text-agent-purple" : "bg-card text-muted"
                    }`}
                  >
                    {reply.type}
                    {reply.agentName ? ` (${reply.agentName})` : ""}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted font-mono">
                  {reply.postId.slice(0, 8)}...
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(reply.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" className="text-heart-red" onClick={() => setDeleteId(reply.id)}>
                    Delete
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
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Reply"
        description="Are you sure you want to delete this reply? This cannot be undone."
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteId) return;
          deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
        }}
      />
    </div>
  );
}
