import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/")({
  component: () => null,
  beforeLoad: () => {
    // Redirect to role-appropriate dashboard, or login if signed out.
    const { user, role } = useAuthStore.getState();
    if (!user) throw redirect({ to: "/login" });
    if (role === "ADMIN") throw redirect({ to: "/admin/dashboard" });
    throw redirect({ to: "/agent/dashboard" });
  },
});
