import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { supabase } from './supabase'

const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:3000/api/v1'

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
})

apiClient.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
      ;(config.headers as Record<string, string>).Authorization =
        `Bearer ${token}`
    }
  } catch {
    // ignore — request will fail with 401 and trigger refresh path
  }
  return config
})

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      try {
        await supabase.auth.refreshSession()
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (token) {
          ;(original.headers as Record<string, string>).Authorization =
            `Bearer ${token}`
          return apiClient(original)
        }
      } catch {
        /* fallthrough to reject */
      }
    }
    return Promise.reject(error)
  },
)
