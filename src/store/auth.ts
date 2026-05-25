import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, type AppUser } from "@/lib/supabase";

type User = AppUser;

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken, refreshToken) => {
        if (refreshToken && typeof window !== "undefined") {
          localStorage.setItem("refreshToken", refreshToken);
        }
        set({ user, accessToken });
      },
      setTokens: (accessToken, refreshToken) => {
        if (refreshToken && typeof window !== "undefined") {
          localStorage.setItem("refreshToken", refreshToken);
        }
        set({ accessToken });
      },
      clearAuth: () => {
        if (typeof window !== "undefined") localStorage.removeItem("refreshToken");
        set({ user: null, accessToken: null });
      },
      logout: async () => {
        await supabase.auth.signOut();
        if (typeof window !== "undefined") localStorage.removeItem("refreshToken");
        set({ user: null, accessToken: null });
      },
    }),
    { name: "propvault-auth" }
  )
);
