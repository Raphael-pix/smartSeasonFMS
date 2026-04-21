import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined

if (!url || !publishableKey) {
  throw new Error('Supabase not configured')
}

export const supabase = createClient(url, publishableKey)

export const isSupabaseConfigured = Boolean(url && publishableKey)
