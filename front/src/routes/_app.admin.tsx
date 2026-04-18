import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/_app/admin')({
  beforeLoad: () => {
    const { user, role, isLoading } = useAuthStore.getState()
    if (isLoading) return
    if (!user) {
      throw redirect({ to: '/login' as any })
    }
    if (role !== 'ADMIN') {
      throw redirect({ to: '/agent/dashboard' as any })
    }
  },
  component: () => <Outlet />,
})
