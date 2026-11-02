
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

  const [prompt, setPrompt] = useState<{
    open: boolean;
    next: string;
  }>({
    open: false,
    next: "/",
  });

  const router = useRouter();
  const pathname = usePathname();

  // Restore the existing session when the application loads.
  const refreshUser = useCallback(async () => {
    try {
      const result = await authApi.me();
      setUser(result.user);
    } catch (error) {
      // Do not erase an existing user because of a temporary API failure.
      console.error("Unable to restore authentication session:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Restore the session once when the application starts.
  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  // Sign in and immediately update the global authentication state.
  const login = useCallback(async (input: LoginInput) => {
    const result = await authApi.login(input);

    if (!result.user) {
      throw new Error("Login succeeded but no user was returned.");
    }

    setUser(result.user);
    setLoading(false);
  }, []);

  // Sign out and clear the global authentication state.
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setLoading(false);
      router.replace("/");
    }
  }, [router]);

  const requireAuth = useCallback(
    (next = pathname || "/") => {
      setPrompt({
        open: true,
        next,
      });
    },
    [pathname]
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
        open={prompt.open}
        next={prompt.next}
        onClose={() =>
          setPrompt((current) => ({
            ...current,
            open: false,
          }))
        }
      />
    </AuthContext.Provider>
  );
}
