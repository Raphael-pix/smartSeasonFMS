import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sprout, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '#/services/users.service'

const schema = z.object({
  fullName: z.string().min(2, 'At least 3 characters'),
  phone: z
    .string()
    .min(10, 'Phone number is too short')
    .max(15, 'Phone number is too long')
    .regex(/^(\+254|0)[0-9]{9}$/, 'Invalid phone number')
    .optional(),
  password: z.string().min(8, 'At least 8 characters'),
})

type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/auth/complete-profile')({
  component: UpdateProfilePage,
})

function UpdateProfilePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [submitting, setSubmitting] = useState(false)

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: any) => usersService.update(userId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['users', variables.userId] })
      qc.invalidateQueries({ queryKey: ['users', 'agents'] })
      qc.invalidateQueries({ queryKey: ['users', 'me'] })
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    if (!isSupabaseConfigured) {
      toast.error('Failed to login. Please try again.')
      return
    }

    setSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Session expired. Please use the invite link again.')
        return
      }

      // 1. Update auth password
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      })

      if (error) throw error

      // 2. Update database profile
      await updateUserMutation.mutateAsync({
        userId: user.id,
        data: {
          fullName: values.fullName,
          phone: values.phone,
        },
      })

      toast.success('Profile updated. Please sign in.')
      navigate({ to: '/login' })
    } catch (e) {
      toast.error('Failed to update profile. Please try again.')
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
            Coordinate fields. <br />
            Empower agents. <br />
            Grow more, season after season.
          </h1>
          <p className="max-w-md text-sm text-sidebar-foreground/80">
            A lightweight monitoring platform built for rural Kenya — fast on
            low-end phones, resilient on patchy networks.
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
            Complete your profile
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Set your password and details to access the system.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name*</Label>
              <Input
                id="fullName"
                type="text"
                autoComplete="fullName"
                placeholder="John Doe"
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="phone"
                placeholder="0712345678"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password*</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                'Complete Profile'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
