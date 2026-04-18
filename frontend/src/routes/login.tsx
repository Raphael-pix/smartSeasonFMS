/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sprout, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { usersService } from "@/services/users.service";
import { toast } from "sonner";

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({
  component: LoginPage,
  beforeLoad: () => {
    const { user, role } = useAuthStore.getState();
    if (user) {
      const target = role === "ADMIN" ? "/admin/dashboard" : "/agent/dashboard";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw redirect({ to: target as any });
    }
  },
});

function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [submitting, setSubmitting] = useState(false);
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) {
      const target = role === "ADMIN" ? "/admin/dashboard" : "/agent/dashboard";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to: target as any });
    }
  }, [user, role, navigate]);

  const onSubmit = async (values: FormValues) => {
    if (!isSupabaseConfigured) {
      toast.error("Supabase is not configured. Add VITE_SUPABASE_* to .env.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;
      const me = await usersService.me();
      setUser(me);
      toast.success(`Welcome back, ${me.fullName ?? me.email}`);
      const target =
        me.role === "ADMIN" ? "/admin/dashboard" : "/agent/dashboard";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to: target as any });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Sign-in failed. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

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
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the credentials provided by your coordinator.
          </p>

          {!isSupabaseConfigured && (
            <div className="mt-6 rounded-md border border-warning/30 bg-warning-soft p-3 text-xs text-warning-foreground">
              Supabase isn't configured yet. Set <code>VITE_SUPABASE_URL</code>{" "}
              and <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code>{" "}
              to enable sign-in.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="agent@smartseason.co.ke"
                {...register("email")}
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
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
            <button
              type="button"
              className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
              onClick={() =>
                toast.info("Contact your coordinator to reset your password.")
              }
            >
              Forgot password?
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
