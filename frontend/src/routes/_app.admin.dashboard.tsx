import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Sprout,
  Users as UsersIcon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react'
import { useAdminDashboard } from '@/hooks/useDashboard'
import { SummaryCard } from '@/components/dashboard/SummaryCard'
import { StatusDonutChart } from '@/components/dashboard/StatusDonutChart'
import { StageBarChart } from '@/components/dashboard/StageBarChart'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StageBadge } from '@/components/ui/StageBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatDateTime, timeAgo } from '@/lib/format'

export const Route = createFileRoute('/_app/admin/dashboard')({
  component: AdminDashboardPage,
})

function AdminDashboardPage() {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } =
    useAdminDashboard()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Coordinator dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Live overview of fields, agents, and recent activity.
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
              className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Couldn't load dashboard. Check your connection to the API.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : (
          <>
            <SummaryCard
              label="Total fields"
              value={data?.summary.totalFields ?? 0}
              icon={Sprout}
            />
            <SummaryCard
              label="Active agents"
              value={data?.summary.activeAgents ?? 0}
              icon={UsersIcon}
              tone="muted"
            />
            <SummaryCard
              label="At risk"
              value={data?.summary.byStatus.AT_RISK ?? 0}
              icon={AlertTriangle}
              tone="warning"
            />
            <SummaryCard
              label="Completed"
              value={data?.summary.byStatus.COMPLETED ?? 0}
              icon={CheckCircle2}
              tone="success"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <StatusDonutChart
                data={
                  data?.summary.byStatus ?? {
                    ACTIVE: 0,
                    AT_RISK: 0,
                    COMPLETED: 0,
                  }
                }
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Crop stages</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <StageBarChart
                data={
                  data?.summary.byStage ?? {
                    PLANTED: 0,
                    GROWING: 0,
                    READY: 0,
                    HARVESTED: 0,
                  }
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* At-risk + Recent activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">At-risk fields</CardTitle>
            <Link
              to={'/admin/fields' as any}
              className="text-xs font-medium text-primary hover:underline"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (data?.atRiskFields.length ?? 0) === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                No at-risk fields. 🎉
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Field</th>
                      <th className="px-4 py-2 font-medium">Crop</th>
                      <th className="px-4 py-2 font-medium">County</th>
                      <th className="px-4 py-2 font-medium">Agent</th>
                      <th className="px-4 py-2 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.atRiskFields.map((f) => (
                      <tr
                        key={f.id}
                        className="border-b border-border last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-4 py-3">
                          <Link
                            to={'/fields/$id' as any}
                            params={{ id: f.id } as any}
                            className="font-medium text-foreground hover:underline"
                          >
                            {f.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {f.cropType}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {f.location.county}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {f.agent?.fullName ?? f.agent?.email ?? 'Unassigned'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {timeAgo(f.lastUpdatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : (data?.recentUpdates.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No recent updates yet.
              </p>
            ) : (
              data!.recentUpdates.slice(0, 10).map((u) => (
                <div
                  key={u.id}
                  className="flex gap-3 rounded-lg border border-border p-3"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={'/fields/$id' as any}
                        params={{ id: u.field.id } as any}
                        className="truncate text-sm font-medium text-foreground hover:underline"
                      >
                        {u.field.name}
                      </Link>
                      <StageBadge stage={u.stage} />
                    </div>
                    {u.notes && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {u.notes}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {u.agent.fullName ?? u.agent.email} ·{' '}
                      {formatDateTime(u.observedAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// keep StatusBadge import for tree-shake reference if needed in future variants
void StatusBadge
