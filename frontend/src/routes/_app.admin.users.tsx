import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/PagerControls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableRowSkeleton } from "@/components/fields/FieldsSkeleton";
import { Search, Users as UsersIcon } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<string>("all");
  const [q, setQ] = useState("");
  const { data, isLoading, isError } = useUsers({
    page,
    role: role === "all" ? undefined : role,
  });

  const filtered =
    data?.data.filter((u) => {
      if (!q.trim()) return true;
      const t = q.toLowerCase();
      return (
        u.email.toLowerCase().includes(t) ||
        (u.fullName ?? "").toLowerCase().includes(t)
      );
    }) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Users
        </h1>
        <p className="text-sm text-muted-foreground">
          All coordinators and field agents.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-3 md:p-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
            <div className="relative md:col-span-6">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name or email…"
                className="pl-8"
              />
            </div>
            <div className="md:col-span-3">
              <Select
                value={role}
                onValueChange={(v) => {
                  setRole(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="AGENT">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Couldn't load users.
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-160 text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Full name</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={5} />
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      <UsersIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {u.email}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.fullName ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                            u.role === "ADMIN"
                              ? "bg-accent text-accent-foreground"
                              : "bg-primary-soft text-primary",
                          )}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs",
                            u.isActive
                              ? "text-success"
                              : "text-muted-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              u.isActive
                                ? "bg-success"
                                : "bg-neutral-soft-foreground",
                            )}
                          />
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data?.meta && (
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
