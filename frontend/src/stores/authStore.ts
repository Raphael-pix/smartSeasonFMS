import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role, User } from '@/types/api.types'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  role: Role | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isLoading: true,
      setUser: (user) => set({ user, role: user?.role ?? null }),
      setLoading: (isLoading) => set({ isLoading }),
      signOut: async () => {
        try {
          await supabase.auth.signOut()
        } catch {
          /* ignore */
        }
        set({ user: null, role: null })
      },
    }),
    {
      name: 'smartseason-auth',
      partialize: (s) => ({ user: s.user, role: s.role }),
    },
  ),
)
