import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sprout, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { usersService } from '@/services/users.service'

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
})
type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/signup')({
  beforeLoad: () => {
    const { user, role } = useAuthStore.getState()
    if (user) {
      if (!user.farmId) throw redirect({ to: '/onboarding' })
      throw redirect({
        to: role === 'ADMIN' ? '/admin/dashboard' : '/agent/dashboard',
      })
    }
  },
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const [submitting, setSubmitting] = useState(false)

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
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
          data: { full_name: values.fullName },
        },
      })
      if (error) throw error

      if (data.session) {
        try {
          const me = await usersService.me()
          setUser(me)
        } catch {}
        toast.success("Account created. Let's get you set up.")
        navigate({ to: '/onboarding' })
      } else {
        toast.success('Check your email to confirm your account.')
        navigate({ to: '/login' })
      }
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Sign-up failed. Please try again.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
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
            Start tracking your fields <br />
            in minutes.
          </h1>
          <p className="max-w-md text-sm text-sidebar-foreground/80">
            Create an account, then either start a new farm or join an existing
            one with an invite code.
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
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Create your account
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You'll set up or join a farm right after.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@smartseason.co.ke"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating
                  account…
                </>
              ) : (
                'Create account'
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
