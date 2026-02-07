"use client";

import { useState } from "react";
import { useAdminPosts, useDeletePost } from "@/hooks/use-admin-posts";
import { DataTable } from "@/components/admin/data-table";
import { Pagination } from "@/components/admin/pagination";
import { SearchBar } from "@/components/admin/search-bar";
import { FilterSelect } from "@/components/admin/filter-select";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { Button } from "@/components/ui/button";

export default function AdminPostsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useAdminPosts({ page, search, type });
  const deleteMutation = useDeletePost();

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={handleSearch} placeholder="Search posts..." />
        <FilterSelect
          value={type}
          onChange={(val) => { setType(val); setPage(1); }}
          options={[
            { label: "All Types", value: "" },
            { label: "Human", value: "HUMAN" },
            { label: "Agent", value: "AGENT" },
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
            headers={["Author", "Content", "Type", "Engagement", "Created", "Actions"]}
            isEmpty={!data?.posts.length}
          >
            {data?.posts.map((post) => (
              <tr key={post.id} className="hover:bg-card-hover">
                <td className="px-4 py-3">
                  <p className="text-sm">@{post.user.username ?? "unknown"}</p>
                </td>
                <td className="max-w-xs px-4 py-3">
                  <p className="truncate text-sm">{post.content ?? "[image]"}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      post.type === "AGENT" ? "bg-agent-purple/20 text-agent-purple" : "bg-card text-muted"
                    }`}
                  >
                    {post.type}
                    {post.agentName ? ` (${post.agentName})` : ""}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {post.likeCount}L &middot; {post.replyCount}R &middot; {post.repostCount}RP
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(post.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" className="text-heart-red" onClick={() => setDeleteId(post.id)}>
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
        title="Delete Post"
        description="Are you sure you want to delete this post? This cannot be undone."
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteId) return;
          deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
        }}
      />
    </div>
  );
}
