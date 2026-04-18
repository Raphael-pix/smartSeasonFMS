import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/_app/admin")({
  beforeLoad: () => {
    const { user, role, isLoading } = useAuthStore.getState();
    if (isLoading) return;
    if (!user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw redirect({ to: "/login" as any });
    }
    if (role !== "ADMIN") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw redirect({ to: "/agent/dashboard" as any });
    }
  },
  component: () => <Outlet />,
});
