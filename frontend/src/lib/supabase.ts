import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

function makeStub(): SupabaseClient {
  const err = () =>
    new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env.",
    );
  const stub = {
    auth: {
      signInWithPassword: async () => {
        throw err();
      },
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      refreshSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
  };
  return stub as unknown as SupabaseClient;
}

export const supabase: SupabaseClient =
  url && publishableKey ? createClient(url, publishableKey) : makeStub();

export const isSupabaseConfigured = Boolean(url && publishableKey);
