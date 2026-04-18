import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Sprout } from "lucide-react";
import { useFields } from "@/hooks/useFields";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FieldCard } from "@/components/fields/FieldCard";
import { FieldCardSkeletonGrid } from "@/components/fields/FieldsSkeleton";
import { Pagination } from "@/components/ui/PagerControls";

export const Route = createFileRoute("/_app/agent/fields")({
  component: AgentFieldsPage,
});

function AgentFieldsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const { data, isLoading, isError } = useFields({
    page,
    limit: 12,
    status: status === "all" ? undefined : status,
  });

  const filtered = (data?.data ?? []).filter((f) => {
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return (
      f.name.toLowerCase().includes(t) ||
      f.cropType.toLowerCase().includes(t) ||
      f.location.county.toLowerCase().includes(t)
    );
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          My fields
        </h1>
        <p className="text-sm text-muted-foreground">
          Tap a field to view details or submit an update.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
            <div className="relative sm:col-span-8">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search field, crop or county…"
                className="pl-8"
              />
            </div>
            <div className="sm:col-span-4">
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="AT_RISK">At Risk</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Couldn't load fields.
        </div>
      )}

      {isLoading ? (
        <FieldCardSkeletonGrid count={6} />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <Sprout className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
            No fields match your search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((f) => (
            <FieldCard key={f.id} field={f} />
          ))}
        </div>
      )}

      {data?.meta && (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onChange={setPage}
        />
      )}
    </div>
  );
}
