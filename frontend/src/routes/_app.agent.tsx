import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/_app/agent')({
  beforeLoad: () => {
    const { user, role, isLoading } = useAuthStore.getState()
    if (isLoading) return
    if (!user) {
      throw redirect({ to: '/login' as any })
    }
    if (role !== 'AGENT') {
      throw redirect({ to: '/admin/dashboard' as any })
    }
  },
  component: () => <Outlet />,
})
