import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout, AlertTriangle, Activity, RefreshCw } from "lucide-react";
import { useAgentDashboard } from "@/hooks/useDashboard";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { FieldCard } from "@/components/fields/FieldCard";
import { FieldCardSkeletonGrid } from "@/components/fields/FieldsSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StageBadge } from "@/components/ui/StageBadge";
import { useAuthStore } from "@/stores/authStore";
import { formatDateTime, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_app/agent/dashboard")({
  component: AgentDashboardPage,
});

function AgentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } =
    useAgentDashboard();

  const totalAssigned = data?.summary.totalAssigned ?? 0;
  const atRisk = (data?.summary.byStatus?.AT_RISK as number | undefined) ?? 0;
  const active = (data?.summary.byStatus?.ACTIVE as number | undefined) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Karibu, {user?.fullName?.split(" ")[0] ?? "Agent"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here are your assigned fields and recent observations.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {dataUpdatedAt > 0 && (
            <span>
              Updated {timeAgo(new Date(dataUpdatedAt).toISOString())}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Couldn't load dashboard. Check your connection.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Assigned" value={totalAssigned} icon={Sprout} />
        <SummaryCard
          label="Active"
          value={active}
          icon={Activity}
          tone="success"
        />
        <SummaryCard
          label="Need attention"
          value={atRisk}
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      {/* Attention required */}
      {(data?.attentionRequired?.length ?? 0) > 0 && (
        <Card className="border-warning/40 bg-warning-soft/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning-foreground" />
              These fields need attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data!.attentionRequired.map((f) => (
                <FieldCard key={f.id} field={f} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All assigned fields */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            All assigned fields
          </h2>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to={"/agent/fields" as any}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all →
          </Link>
        </div>

        {isLoading ? (
          <FieldCardSkeletonGrid count={6} />
        ) : (data?.assignedFields?.length ?? 0) === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No fields assigned yet. Your coordinator will assign you soon.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data!.assignedFields.slice(0, 8).map((f) => (
              <FieldCard key={f.id} field={f} />
            ))}
          </div>
        )}
      </section>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your recent updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : (data?.recentActivity?.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No updates yet — submit one from a field's detail page.
            </p>
          ) : (
            data!.recentActivity.map((u) => (
              <div
                key={u.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    to={"/fields/$id" as any}
                    params={{ id: u.field.id } as any}
                    className="block truncate text-sm font-medium text-foreground hover:underline"
                  >
                    {u.field.name}
                  </Link>
                  {u.notes && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {u.notes}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {formatDateTime(u.observedAt)}
                  </p>
                </div>
                <StageBadge stage={u.stage} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
