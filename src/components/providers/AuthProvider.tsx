"use client";

import { useEffect } from "react";
import { mapSupabaseSession, supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const session = mapSupabaseSession(data.session);
        setAuth(session.user, session.accessToken, session.refreshToken);
        return;
      }

      // Try restoring from stored refresh token (fallback)
      try {
        const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
        if (refreshToken) {
          const { data: setData, error: setErr } = await supabase.auth.setSession({ refresh_token: refreshToken });
          if (!setErr && setData.session) {
            const session = mapSupabaseSession(setData.session);
            setAuth(session.user, session.accessToken, session.refreshToken);
          }
        }
      } catch (e) {
        // ignore
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        clearAuth();
        return;
      }

      const mapped = mapSupabaseSession(session);
      setAuth(mapped.user, mapped.accessToken, mapped.refreshToken);
    });

    return () => listener.subscription.unsubscribe();
  }, [clearAuth, setAuth]);

  return children;
}
