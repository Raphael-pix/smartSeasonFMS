import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2,
  Copy,
  RefreshCw,
  Loader2,
  Trash2,
  Users as UsersIcon,
  Sprout,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAuthStore } from '@/stores/authStore'
import {
  useMyFarm,
  useRegenerateInvite,
  useRemoveMember,
  useUpdateFarm,
} from '@/hooks/useFarms'
import { formatDate } from '@/lib/format'

export const Route = createFileRoute('/_app/farm')({
  beforeLoad: () => {
    const { user, isLoading } = useAuthStore.getState()
    if (isLoading) return
    if (!user) {
      throw redirect({ to: '/login' })
    }
    if (!user.farmId) {
      throw redirect({ to: '/onboarding' })
    }
  },
  component: FarmSettingsPage,
})

const updateSchema = z.object({
  name: z.string().min(2, 'Required'),
  county: z.string().optional(),
  description: z.string().max(280).optional(),
})
type UpdateValues = z.infer<typeof updateSchema>

function FarmSettingsPage() {
  const role = useAuthStore((s) => s.role)
  const me = useAuthStore((s) => s.user)
  const isAdmin = role === 'ADMIN'
  const { data: farm, isLoading } = useMyFarm()
  const updateFarm = useUpdateFarm()
  const regenerate = useRegenerateInvite()
  const removeMember = useRemoveMember()
  const [editing, setEditing] = useState(false)

  const form = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
    values: {
      name: farm?.name ?? '',
      description: farm?.description ?? '',
    },
  })

  const copyCode = async () => {
    if (!farm?.inviteCode) return
    try {
      await navigator.clipboard.writeText(farm.inviteCode)
      toast.success('Invite code copied')
    } catch {
      toast.error('Could not copy — long-press to copy manually')
    }
  }

  const onSave = async (values: UpdateValues) => {
    try {
      await updateFarm.mutateAsync({
        name: values.name.trim(),
        county: values.county?.trim() || undefined,
        description: values.description?.trim() || undefined,
      })
      toast.success('Farm updated')
      setEditing(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save')
    }
  }

  const onRegenerate = async () => {
    try {
      const res = await regenerate.mutateAsync()
      toast.success('New invite code generated')
      try {
        await navigator.clipboard.writeText(res.inviteCode)
      } catch {
        /* ignore */
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not regenerate')
    }
  }

  const onRemove = async (memberId: string, name: string) => {
    try {
      await removeMember.mutateAsync(memberId)
      toast.success(`Removed ${name}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not remove member')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    )
  }

  if (!farm) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Could not load your farm.
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {farm.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {farm._count?.users ?? farm.users.length} members ·{' '}
            {farm._count?.fields ?? 0} fields · joined{' '}
            {formatDate(farm.createdAt)}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Farm details</CardTitle>
          {isAdmin && !editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...form.register('name')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  {...form.register('description')}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateFarm.isPending}>
                  {updateFarm.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false)
                    form.reset()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Slug</dt>
                <dd className="font-mono text-xs text-foreground">
                  {farm.slug}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Description</dt>
                <dd className="text-foreground">
                  {farm.description ?? 'No description yet.'}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite agents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Share this code via SMS or WhatsApp. Anyone with the code can join
              this farm.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex flex-1 items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
                <code className="font-mono text-base font-semibold tracking-widest text-foreground">
                  {farm.inviteCode}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyCode}
                  aria-label="Copy invite code"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate invite code?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The current code will stop working immediately. You'll
                      need to share the new code with anyone you want to invite.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onRegenerate}>
                      Regenerate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UsersIcon className="h-4 w-4" /> Members
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {farm.users.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No members yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {farm.users.map((u) => {
                const isSelf = u.id === me?.id
                return (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <Sprout className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {u.fullName ?? u.email}
                          </p>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {u.role}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] text-muted-foreground">
                              (you)
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    {isAdmin && !isSelf && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Remove member"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove {u.fullName ?? u.email}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              They'll be unassigned from any fields and lose
                              access to this farm. They'll need a new invite to
                              rejoin.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                onRemove(u.id, u.fullName ?? u.email)
                              }
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
