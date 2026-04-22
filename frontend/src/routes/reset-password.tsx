import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sprout, Loader2, KeyRound, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { toast } from 'sonner'

const schema = z
  .object({
    password: z.string().min(6, 'At least 6 characters'),
    confirm: z.string().min(6, 'At least 6 characters'),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  })

type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(
    null,
  )

  // Supabase emits a PASSWORD_RECOVERY auth event when the user lands
  // here from the reset email. We also check for an existing session as a
  // fallback (in case the event already fired before this component mounted).
  useEffect(() => {
    let cancelled = false

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!cancelled && data.session) {
        setHasRecoverySession(true)
      } else if (!cancelled) {
        setHasRecoverySession((prev) => prev ?? false)
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setHasRecoverySession(true)
      }
    })

    checkSession()

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    if (!isSupabaseConfigured) {
      toast.error('Supabase is not configured.')
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      })
      if (error) throw error
      setDone(true)
      toast.success('Password updated. Please sign in.')
      // Sign out the recovery session so the user logs in fresh.
      await supabase.auth.signOut()
      setTimeout(() => navigate({ to: '/login' }), 1500)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't update password."
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            SmartSeason
          </span>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold leading-tight">
            Choose a new password.
          </h1>
          <p className="max-w-md text-sm text-sidebar-foreground/80">
            Pick something memorable but hard to guess. You'll use it next time
            you sign in.
          </p>
        </div>
        <div className="text-xs text-sidebar-foreground/60">
          © {new Date().getFullYear()} SmartSeason
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-sidebar-primary/20 blur-3xl"
        />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sprout className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              SmartSeason
            </span>
          </div>

          {done ? (
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Password updated
              </h2>
              <p className="text-sm text-muted-foreground">
                Redirecting you to sign in…
              </p>
            </div>
          ) : hasRecoverySession === false ? (
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-warning-foreground">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Reset link invalid or expired
              </h2>
              <p className="text-sm text-muted-foreground">
                This password reset link is no longer valid. Request a new one
                to continue.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link to="/forgot-password">Request a new link</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link to="/login">Back to sign in</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                <KeyRound className="h-5 w-5" /> Set new password
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter and confirm your new password below.
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-6 space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...register('confirm')}
                  />
                  {errors.confirm && (
                    <p className="text-xs text-destructive">
                      {errors.confirm.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full text-base"
                  disabled={submitting || hasRecoverySession === null}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                      Updating…
                    </>
                  ) : (
                    'Update password'
                  )}
                </Button>
                <p className="pt-2 text-center text-xs text-muted-foreground">
                  <Link
                    to="/login"
                    className="font-medium text-primary hover:underline"
                  >
                    Back to sign in
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
