import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    const { user, isLoading } = useAuthStore.getState();
    // While bootstrapping the session we still let the route render — the
    // layout itself shows a soft loading state via children. Only redirect
    // once loading has finished and there is no user.
    if (!isLoading && !user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
