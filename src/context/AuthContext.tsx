
"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@/types/user";
import { authApi } from "@/services/auth-api";
import { GuestActionDialog } from "@/components/auth/GuestActionDialog";

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  requireAuth: (next?: string) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState({
    open: false,
    next: "/",
  });

  const router = useRouter();
  const pathname = usePathname();

  const closePrompt = useCallback(() => {
    setPrompt((current) => ({
      ...current,
      open: false,
    }));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const result = await authApi.me();
      setUser(result.user ?? null);
    } catch (error) {
      console.error("Unable to restore authentication session:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  // Never leave the guest dialog over a different route.
  useEffect(() => {
    closePrompt();
  }, [pathname, closePrompt]);

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await authApi.login(input);

      if (!result.user) {
        throw new Error("Login succeeded but no user was returned.");
      }

      setUser(result.user);
      setLoading(false);
      closePrompt();
    },
    [closePrompt]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setLoading(false);
      closePrompt();
      router.replace("/");
    }
  }, [router, closePrompt]);

  const requireAuth = useCallback(
    (next = pathname || "/") => {
      // Do not prompt while checking the session or if signed in.
      if (loading || user) return;

      setPrompt({
        open: true,
        next,
      });
    },
    [loading, user, pathname]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      refreshUser,
      logout,
      requireAuth,
    }),
    [user, loading, login, refreshUser, logout, requireAuth]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}

      <GuestActionDialog
        open={prompt.open && !user && !loading}
        next={prompt.next}
        onClose={closePrompt}
      />
    </AuthContext.Provider>
  );
}
