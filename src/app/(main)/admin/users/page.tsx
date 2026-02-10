"use client";

import { useState } from "react";
import { useAdminUsers, useUpdateUser, useDeleteUser, type AdminUser } from "@/hooks/use-admin-users";
import { DataTable } from "@/components/admin/data-table";
import { Pagination } from "@/components/admin/pagination";
import { SearchBar } from "@/components/admin/search-bar";
import { FilterSelect } from "@/components/admin/filter-select";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { EditUserModal } from "@/components/admin/edit-user-modal";
import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const { data, isLoading } = useAdminUsers({ page, search, role });
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleRoleFilter = (val: string) => {
    setRole(val);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={handleSearch} placeholder="Search users..." />
        <FilterSelect
          value={role}
          onChange={handleRoleFilter}
          options={[
            { label: "All Roles", value: "" },
            { label: "User", value: "USER" },
            { label: "Admin", value: "ADMIN" },
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
            headers={["User", "Email", "Role", "Posts", "Followers", "Joined", "Actions"]}
            isEmpty={!data?.users.length}
          >
            {data?.users.map((user) => (
              <tr key={user.id} className="hover:bg-card-hover">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{user.name ?? "—"}</p>
                    <p className="text-xs text-muted">@{user.username ?? "no-username"}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted">
                  {user.email ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      user.role === "ADMIN" ? "bg-cyan/20 text-cyan" : "bg-card text-muted"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{user._count.posts}</td>
                <td className="px-4 py-3 text-muted">{user._count.followers}</td>
                <td className="px-4 py-3 text-muted">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditUser(user)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-heart-red" onClick={() => setDeleteTarget(user)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>

          {data && (
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <EditUserModal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
        loading={updateMutation.isPending}
        onSave={(formData) => {
          if (!editUser) return;
          updateMutation.mutate(
            { userId: editUser.id, data: formData },
            { onSuccess: () => setEditUser(null) }
          );
        }}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete User"
        description={`Are you sure you want to delete @${deleteTarget?.username ?? "this user"}? This will permanently remove their account and all associated data.`}
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          });
        }}
      />
    </div>
  );
}
