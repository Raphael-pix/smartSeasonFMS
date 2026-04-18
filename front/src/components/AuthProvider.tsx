import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { usersService } from '@/services/users.service'
import { useAuthStore } from '@/stores/authStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)
  const qc = useQueryClient()

  useEffect(() => {
    let mounted = true

    const fetchMe = async () => {
      try {
        const me = await usersService.me()
        if (mounted) setUser(me)
      } catch {
        if (mounted) setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
        qc.clear()
        return
      }
      void fetchMe()
    })

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) {
          void fetchMe()
        } else {
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return <>{children}</>
}
