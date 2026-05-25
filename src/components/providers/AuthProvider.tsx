"use client";

import { useEffect } from "react";
import { mapSupabaseSession, supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      const session = mapSupabaseSession(data.session);
      setAuth(session.user, session.accessToken, session.refreshToken);
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
