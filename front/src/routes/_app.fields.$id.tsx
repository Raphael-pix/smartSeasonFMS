import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Sprout,
  User as UserIcon,
  Ruler,
  Hash,
  Archive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StageBadge } from '@/components/ui/StageBadge'
import { useFieldDetail, useArchiveField } from '@/hooks/useFields'
import { useFieldUpdates } from '@/hooks/useUpdates'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, formatDateTime, timeAgo } from '@/lib/format'
import { SubmitUpdateForm } from '@/components/fields/SubmitUpdateForm'
import { ImageGallery } from '@/components/fields/ImageGallery'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/fields/$id')({
  component: FieldDetailPage,
})

function FieldDetailPage() {
  const { id } = useParams({ strict: false })
  const role = useAuthStore((s) => s.role)
  const user = useAuthStore((s) => s.user)
  const { data: field, isLoading, isError } = useFieldDetail(id)
  const { data: updates, isLoading: updatesLoading } = useFieldUpdates(id)
  const archive = useArchiveField()

  const isAssignedAgent =
    role === 'AGENT' && field?.agent?.id === user?.id && !field?.isArchived

  const fallbackBack = role === 'ADMIN' ? '/admin/fields' : '/agent/fields'

  if (isError) {
    return (
      <div className="space-y-3">
        <BackLink to={fallbackBack} />
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            Couldn't load field.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <BackLink to={fallbackBack} />

      {isLoading || !field ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : (
        <>
          {/* Header */}
          <Card className="overflow-hidden">
            <div className="relative h-40 w-full bg-linear-to-br from-primary-soft to-accent">
              {field.coverImageUrl && (
                <img
                  src={field.coverImageUrl}
                  alt={field.name}
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute right-3 top-3 flex gap-2">
                <StatusBadge status={field.status} />
                <StageBadge stage={field.currentStage} />
              </div>
            </div>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    {field.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {field.cropType} · planted {formatDate(field.plantingDate)}
                  </p>
                </div>
                {role === 'ADMIN' && !field.isArchived && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await archive.mutateAsync(field.id)
                        toast.success('Field archived')
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : 'Archive failed',
                        )
                      }
                    }}
                  >
                    <Archive className="h-4 w-4" /> Archive
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <Stat
                  icon={MapPin}
                  label="Location"
                  value={[
                    field.location.county,
                    field.location.subCounty,
                    field.location.ward,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                />
                <Stat
                  icon={UserIcon}
                  label="Agent"
                  value={
                    field.agent?.fullName ?? field.agent?.email ?? 'Unassigned'
                  }
                />
                <Stat
                  icon={Ruler}
                  label="Area"
                  value={field.areaSize ? `${field.areaSize} acres` : '—'}
                />
                <Stat
                  icon={Calendar}
                  label="Last update"
                  value={timeAgo(field.lastUpdatedAt)}
                />
                <Stat
                  icon={Sprout}
                  label="Updates"
                  value={String(field._count.updates)}
                />
                <Stat
                  icon={Hash}
                  label="Images"
                  value={String(field._count.images)}
                />
              </div>

              {field.description && (
                <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                  {field.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue={isAssignedAgent ? 'submit' : 'updates'}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="updates">Updates</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="submit" disabled={!isAssignedAgent}>
                Submit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="updates" className="mt-4">
              <Card>
                <CardContent className="space-y-3 p-3 md:p-4">
                  {updatesLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))
                  ) : (updates?.data.length ?? 0) === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No observations recorded yet.
                    </p>
                  ) : (
                    updates!.data.map((u) => (
                      <div
                        key={u.id}
                        className="flex gap-3 rounded-lg border border-border p-3"
                      >
                        {u.imageUrl ? (
                          <img
                            src={u.imageUrl}
                            alt=""
                            loading="lazy"
                            className="h-16 w-16 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                            <Sprout className="h-6 w-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <StageBadge stage={u.stage} />
                            <span className="text-[11px] text-muted-foreground">
                              {formatDateTime(u.observedAt)}
                            </span>
                          </div>
                          {u.notes && (
                            <p className="text-sm text-foreground">{u.notes}</p>
                          )}
                          <p className="text-[11px] text-muted-foreground">
                            by {u.agent.fullName ?? u.agent.email}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images" className="mt-4">
              <Card>
                <CardContent className="p-3 md:p-4">
                  <ImageGallery fieldId={field.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submit" className="mt-4">
              <Card>
                <CardContent className="p-3 md:p-4">
                  {isAssignedAgent ? (
                    <SubmitUpdateForm
                      fieldId={field.id}
                      defaultStage={field.currentStage}
                    />
                  ) : (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Only the assigned agent can submit updates.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

function BackLink({ to }: { to: string }) {
  return (
    <Link
      to={to as any}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> Back
    </Link>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border p-2.5">
      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}
