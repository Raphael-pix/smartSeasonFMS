import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface SettingsState {
  theme: Theme
  notifyUpdates: boolean
  notifyAtRisk: boolean
  dataSaver: boolean
  setTheme: (theme: Theme) => void
  setNotifyUpdates: (v: boolean) => void
  setNotifyAtRisk: (v: boolean) => void
  setDataSaver: (v: boolean) => void
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme
  root.classList.toggle('dark', resolved === 'dark')
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      notifyUpdates: true,
      notifyAtRisk: true,
      dataSaver: false,
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
      setNotifyUpdates: (notifyUpdates) => set({ notifyUpdates }),
      setNotifyAtRisk: (notifyAtRisk) => set({ notifyAtRisk }),
      setDataSaver: (dataSaver) => set({ dataSaver }),
    }),
    {
      name: 'smartseason-settings',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    },
  ),
)
