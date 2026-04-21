import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import {
  User as UserIcon,
  Mail,
  Phone,
  Loader2,
  KeyRound,
  Bell,
  Palette,
  Wifi,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Theme } from '@/stores/settingsStore'
import { usersService } from '@/services/users.service'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePage,
})

const profileSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  phone: z.string().max(20, 'Too long').optional().or(z.literal('')),
})
type ProfileValues = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    password: z.string().min(6, 'At least 6 characters'),
    confirm: z.string().min(6, 'At least 6 characters'),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  })
type PasswordValues = z.infer<typeof passwordSchema>

function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const settings = useSettingsStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
    },
  })

  const updateProfile = useMutation({
    mutationFn: (input: ProfileValues) =>
      usersService.update(user!.id, {
        fullName: input.fullName,
        phone: input.phone || null,
      }),
    onSuccess: (updated) => {
      setUser(updated)
      reset({ fullName: updated.fullName ?? '', phone: updated.phone ?? '' })
      toast.success('Profile updated')
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Couldn't update profile")
    },
  })

  const {
    register: regPwd,
    handleSubmit: handlePwd,
    formState: { errors: pwdErrors },
    reset: resetPwd,
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })

  const [pwdSubmitting, setPwdSubmitting] = useState(false)

  const onChangePassword = async (values: PasswordValues) => {
    setPwdSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      })
      if (error) throw error
      toast.success('Password updated')
      resetPwd()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update password")
    } finally {
      setPwdSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Profile & settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account details and how the app behaves on this device.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-lg">
                {user.fullName ?? user.email}
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 font-medium text-primary">
                  <ShieldCheck className="h-3 w-3" />{' '}
                  {user.role === 'ADMIN' ? 'Coordinator' : 'Field Agent'}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal information</CardTitle>
          <CardDescription>
            Your name and phone are visible to others in your farm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((v: ProfileValues) =>
              updateProfile.mutate(v),
            )}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                placeholder="Jane Wanjiku"
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </span>
              </Label>
              <Input
                id="phone"
                placeholder="+254 7XX XXX XXX"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user.email} disabled />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email.
              </p>
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={!isDirty || updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" /> Change password
          </CardTitle>
          <CardDescription>
            Use at least 6 characters. You'll stay signed in on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handlePwd(onChangePassword)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...regPwd('password')}
              />
              {pwdErrors.password && (
                <p className="text-xs text-destructive">
                  {pwdErrors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                {...regPwd('confirm')}
              />
              {pwdErrors.confirm && (
                <p className="text-xs text-destructive">
                  {pwdErrors.confirm.message}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                variant="secondary"
                disabled={pwdSubmitting}
              >
                {pwdSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…
                  </>
                ) : (
                  'Update password'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">App settings</CardTitle>
          <CardDescription>Saved on this device only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <SettingRow
            icon={<Palette className="h-4 w-4" />}
            title="Appearance"
            description="Choose how SmartSeason looks on this device."
          >
            <Select
              value={settings.theme}
              onValueChange={(v) => settings.setTheme(v as Theme)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow
            icon={<Bell className="h-4 w-4" />}
            title="Field update alerts"
            description="Get notified when agents post new field updates."
          >
            <Switch
              checked={settings.notifyUpdates}
              onCheckedChange={settings.setNotifyUpdates}
            />
          </SettingRow>

          <SettingRow
            icon={<Bell className="h-4 w-4" />}
            title="At-risk field alerts"
            description="Be alerted when a field's status moves to At Risk."
          >
            <Switch
              checked={settings.notifyAtRisk}
              onCheckedChange={settings.setNotifyAtRisk}
            />
          </SettingRow>

          <SettingRow
            icon={<Wifi className="h-4 w-4" />}
            title="Data saver"
            description="Load smaller images and skip auto-refresh on cellular."
          >
            <Switch
              checked={settings.dataSaver}
              onCheckedChange={settings.setDataSaver}
            />
          </SettingRow>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingRow({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
