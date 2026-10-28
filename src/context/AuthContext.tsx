"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@/types/user";
import { authApi } from "@/services/auth-api";
import { GuestActionDialog } from "@/components/auth/GuestActionDialog";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  requireAuth: (next?: string) => void;
};
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState<{ open: boolean; next: string }>({ open: false, next: "/" });
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    try {
      const result = await authApi.me();
      setUser(result.user);
    } catch {
      // Keep the last known session state if the API is temporarily unreachable.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refreshUser(); }, [refreshUser]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); }
    finally { setUser(null); router.replace("/"); }
  }, [router]);

  const requireAuth = useCallback((next = pathname || "/") => setPrompt({ open: true, next }), [pathname]);
  const value = useMemo(() => ({ user, loading, refreshUser, logout, requireAuth }), [user, loading, refreshUser, logout, requireAuth]);

  return <AuthContext.Provider value={value}>{children}<GuestActionDialog open={prompt.open} next={prompt.next} onClose={() => setPrompt((current) => ({ ...current, open: false }))} /></AuthContext.Provider>;
}
