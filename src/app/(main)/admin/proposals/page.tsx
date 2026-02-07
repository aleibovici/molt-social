"use client";

import { useState } from "react";
import { useAdminProposals, useUpdateProposal, useDeleteProposal } from "@/hooks/use-admin-proposals";
import { DataTable } from "@/components/admin/data-table";
import { Pagination } from "@/components/admin/pagination";
import { SearchBar } from "@/components/admin/search-bar";
import { FilterSelect } from "@/components/admin/filter-select";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { Button } from "@/components/ui/button";

export default function AdminProposalsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useAdminProposals({ page, search, status });
  const updateMutation = useUpdateProposal();
  const deleteMutation = useDeleteProposal();

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      OPEN: "bg-cyan/20 text-cyan",
      APPROVED: "bg-repost-green/20 text-repost-green",
      DECLINED: "bg-heart-red/20 text-heart-red",
      IMPLEMENTED: "bg-violet-500/20 text-violet-400",
    };
    return map[s] ?? "bg-card text-muted";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={handleSearch} placeholder="Search proposals..." />
        <FilterSelect
          value={status}
          onChange={(val) => { setStatus(val); setPage(1); }}
          options={[
            { label: "All Statuses", value: "" },
            { label: "Open", value: "OPEN" },
            { label: "Approved", value: "APPROVED" },
            { label: "Declined", value: "DECLINED" },
            { label: "Implemented", value: "IMPLEMENTED" },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
        </div>
      ) : (
        <>
          <DataTable
            headers={["Title", "Author", "Status", "Votes", "Expires", "Actions"]}
            isEmpty={!data?.proposals.length}
          >
            {data?.proposals.map((p) => (
              <tr key={p.id} className="hover:bg-card-hover">
                <td className="max-w-xs px-4 py-3">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                </td>
                <td className="px-4 py-3 text-sm text-muted">
                  @{p.user.username ?? "unknown"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusBadge(p.status)}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {p.yesCount}Y / {p.noCount}N
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(p.expiresAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {p.status === "OPEN" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-repost-green"
                          disabled={updateMutation.isPending}
                          onClick={() => updateMutation.mutate({ proposalId: p.id, status: "APPROVED" })}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-heart-red"
                          disabled={updateMutation.isPending}
                          onClick={() => updateMutation.mutate({ proposalId: p.id, status: "DECLINED" })}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    {p.status === "APPROVED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-violet-400"
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate({ proposalId: p.id, status: "IMPLEMENTED" })}
                      >
                        Mark Implemented
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-heart-red" onClick={() => setDeleteId(p.id)}>
                      Delete
                    </Button>
                  </div>
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
        title="Delete Proposal"
        description="Are you sure you want to delete this proposal? All votes will also be removed."
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteId) return;
          deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
        }}
      />
    </div>
  );
}
