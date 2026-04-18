import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { usersService } from "@/services/users.service";
import { useAuthStore } from "@/stores/authStore";

/**
 * Mounts once at the root. Bootstraps Supabase session, fetches /users/me,
 * and subscribes to auth state changes. MUST set up onAuthStateChange BEFORE
 * calling getSession to avoid race conditions.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const qc = useQueryClient();

  useEffect(() => {
    let mounted = true;

    const fetchMe = async () => {
      try {
        const me = await usersService.me();
        if (mounted) setUser(me);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // 1) Subscribe first
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
        qc.clear();
        return;
      }
      // For SIGNED_IN / TOKEN_REFRESHED — refetch profile
      void fetchMe();
    });

    // 2) Then check existing session
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) {
          void fetchMe();
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
