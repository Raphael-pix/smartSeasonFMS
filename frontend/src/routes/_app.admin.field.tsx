/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Sprout } from "lucide-react";
import { useFields } from "@/hooks/useFields";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StageBadge } from "@/components/ui/StageBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/PagerControls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TableRowSkeleton } from "@/components/fields/FieldsSkeleton";
import { CreateFieldDialog } from "@/components/fields/CreateFieldDialog";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_app/admin/field")({
  component: AdminFieldsPage,
});

function AdminFieldsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [stage, setStage] = useState<string>("all");
  const [county, setCounty] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const params = {
    page,
    limit: 20,
    status: status === "all" ? undefined : status,
    stage: stage === "all" ? undefined : stage,
    county: county.trim() || undefined,
    includeArchived,
  };

  const { data, isLoading, isError } = useFields(params);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Fields
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage all fields, assignments, and progress.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New field
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 p-3 md:p-4">
          {/* Filters */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
            <div className="relative md:col-span-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={county}
                onChange={(e) => {
                  setCounty(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by county…"
                className="pl-8"
              />
            </div>
            <div className="md:col-span-3">
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="AT_RISK">At Risk</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Select
                value={stage}
                onValueChange={(v) => {
                  setStage(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  <SelectItem value="PLANTED">Planted</SelectItem>
                  <SelectItem value="GROWING">Growing</SelectItem>
                  <SelectItem value="READY">Ready</SelectItem>
                  <SelectItem value="HARVESTED">Harvested</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 md:col-span-2 md:justify-end">
              <Switch
                id="archived"
                checked={includeArchived}
                onCheckedChange={(v) => {
                  setIncludeArchived(Boolean(v));
                  setPage(1);
                }}
              />
              <Label htmlFor="archived" className="text-xs">
                Show archived
              </Label>
            </div>
          </div>

          {isError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Couldn't load fields.
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-190 text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Crop</th>
                  <th className="px-4 py-2 font-medium">County</th>
                  <th className="px-4 py-2 font-medium">Agent</th>
                  <th className="px-4 py-2 font-medium">Stage</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={7} />
                  ))
                ) : (data?.data?.length ?? 0) === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      <Sprout className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
                      No fields match these filters.
                    </td>
                  </tr>
                ) : (
                  data!.data.map((f) => (
                    <tr
                      key={f.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <Link
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          to={"/fields/$id" as any}
                          params={{ id: f.id } as any}
                          className="font-medium text-foreground hover:underline"
                        >
                          {f.name}
                        </Link>
                        {f.isArchived && (
                          <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {f.cropType}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {f.location.county}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {f.agent?.fullName ?? f.agent?.email ?? (
                          <span className="italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StageBadge stage={f.currentStage} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={f.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {timeAgo(f.lastUpdatedAt)}
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

      <CreateFieldDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
