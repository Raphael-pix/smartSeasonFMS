import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sprout, Loader2, Plus, KeyRound, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/stores/authStore'
import { useCreateFarm, useJoinFarm } from '@/hooks/useFarms'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: () => {
    const { user, isLoading } = useAuthStore.getState()
    if (isLoading) return
    if (!user) {
      throw redirect({ to: '/login' })
    }
    if (user.farmId) {
      const target =
        user.role === 'ADMIN' ? '/admin/dashboard' : '/agent/dashboard'
      throw redirect({ to: target })
    }
  },
  component: OnboardingPage,
})

const createSchema = z.object({
  name: z.string().min(2, 'Farm name is required'),
  county: z.string().optional(),
  description: z.string().max(280, 'Keep it short').optional(),
})
type CreateValues = z.infer<typeof createSchema>

const joinSchema = z.object({
  inviteCode: z
    .string()
    .min(8, 'Enter the full invite code')
    .transform((v) => v.trim().toUpperCase()),
})
type JoinValues = z.infer<typeof joinSchema>

function OnboardingPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const createFarm = useCreateFarm()
  const joinFarm = useJoinFarm()
  const [tab, setTab] = useState<'create' | 'join'>('create')

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', county: '', description: '' },
  })
  const joinForm = useForm<JoinValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: { inviteCode: '' },
  })

  const goToApp = (role: 'ADMIN' | 'AGENT') => {
    navigate({ to: role === 'ADMIN' ? '/admin/dashboard' : '/agent/dashboard' })
  }

  const onCreate = async (values: CreateValues) => {
    try {
      await createFarm.mutateAsync({
        name: values.name.trim(),
        county: values.county?.trim() || undefined,
        description: values.description?.trim() || undefined,
      })
      toast.success("Farm created. You're now the admin.")
      goToApp('ADMIN')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create farm')
    }
  }

  const onJoin = async (values: JoinValues) => {
    try {
      const res = await joinFarm.mutateAsync(values.inviteCode)
      toast.success(`Joined ${res.farm.name}`)
      goToApp(useAuthStore.getState().user?.role ?? 'AGENT')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid invite code')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sprout className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              SmartSeason
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground"
          >
            <LogOut className="mr-1.5 h-4 w-4" /> Sign out
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}.
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Before you can track fields, join your farm or create a new one.
          </p>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as 'create' | 'join')}
            className="mt-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">
                <Plus className="mr-1.5 h-4 w-4" /> Create farm
              </TabsTrigger>
              <TabsTrigger value="join">
                <KeyRound className="mr-1.5 h-4 w-4" /> Join with code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-6">
              <form
                onSubmit={createForm.handleSubmit(onCreate)}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="farmName">Farm name</Label>
                  <Input
                    id="farmName"
                    placeholder="e.g. Kiptoo Family Farm"
                    {...createForm.register('name')}
                  />
                  {createForm.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {createForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    placeholder="What do you grow?"
                    {...createForm.register('description')}
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full text-base"
                  disabled={createFarm.isPending}
                >
                  {createFarm.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    'Create farm'
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  You'll become the admin and get an invite code to share with
                  agents.
                </p>
              </form>
            </TabsContent>

            <TabsContent value="join" className="mt-6">
              <form
                onSubmit={joinForm.handleSubmit(onJoin)}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="inviteCode">Invite code</Label>
                  <Input
                    id="inviteCode"
                    placeholder="ABCD-WXYZ-1234"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    className="font-mono uppercase tracking-wider"
                    {...joinForm.register('inviteCode')}
                  />
                  {joinForm.formState.errors.inviteCode && (
                    <p className="text-xs text-destructive">
                      {joinForm.formState.errors.inviteCode.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full text-base"
                  disabled={joinFarm.isPending}
                >
                  {joinFarm.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining…
                    </>
                  ) : (
                    'Join farm'
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Ask your coordinator for the code (sent via SMS or WhatsApp).
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
