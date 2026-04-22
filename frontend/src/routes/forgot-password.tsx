import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sprout, Loader2, ArrowLeft, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    if (!isSupabaseConfigured) {
      toast.error('Supabase is not configured. Add VITE_SUPABASE_* to .env.')
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        values.email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      )
      if (error) throw error
      setSentEmail(values.email)
      setSent(true)
      toast.success('Reset link sent. Check your inbox.')
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't send reset email."
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
            Reset your password. <br />
            Get back to the field.
          </h1>
          <p className="max-w-md text-sm text-sidebar-foreground/80">
            We'll send a secure link to your email so you can choose a new
            password.
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

          {sent ? (
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MailCheck className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Check your email
              </h2>
              <p className="text-sm text-muted-foreground">
                We sent a password reset link to{' '}
                <span className="font-medium text-foreground">{sentEmail}</span>
                . Open it on this device to choose a new password.
              </p>
              <p className="text-xs text-muted-foreground">
                Didn't get it? Check your spam folder, or{' '}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => setSent(false)}
                >
                  try a different email
                </button>
                .
              </p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate({ to: '/login' })}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Forgot password?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the email tied to your account and we'll send you a reset
                link.
              </p>

              {!isSupabaseConfigured && (
                <div className="mt-6 rounded-md border border-warning/30 bg-warning-soft p-3 text-xs text-warning-foreground">
                  Supabase isn't configured yet. Set{' '}
                  <code>VITE_SUPABASE_URL</code> and{' '}
                  <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code>{' '}
                  to enable password reset.
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-6 space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="agent@smartseason.co.ke"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full text-base"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending
                      link…
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
                <p className="pt-2 text-center text-xs text-muted-foreground">
                  Remembered it?{' '}
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
