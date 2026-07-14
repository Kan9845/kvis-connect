"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { userApi, authApi } from "@/lib/api";
import type { UserMe } from "@/lib/types";
import { toast } from "sonner";
import { clearPersistedCache } from "@/lib/cache/persister";
interface AuthContextValue {
  user: UserMe | null;
  loading: boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_DISABLED =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DISABLE_AUTH === "true";

const DEV_MOCK_USER: UserMe = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "dev-user",
  first_name: "Dev",
  last_name: "User",
  email: "dev@kvis.local",
  email_verified: true,
  is_verified: false,
  profile_setup_done: true,
  education: [],
  career: [],
  research_interests: [],
  projects: [],
  publications: [],
  portfolio_links: [],
  languages: [],
  extra_contacts: [],
  has_password: false,
  created_at: new Date().toISOString(),
  permissions: [],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserMe | null>(AUTH_DISABLED ? DEV_MOCK_USER : null);
  const [loading, setLoading] = useState(!AUTH_DISABLED);
  // Track whether the initial session check has completed
  const initialised = useRef(false);

  const fetchMe = async () => {
    if (AUTH_DISABLED) {
      setUser(DEV_MOCK_USER);
      setLoading(false);
      initialised.current = true;
      return;
    }
    try {
      const me = await userApi.getMe();
      setUser(me);
    } catch {
      // If user was previously logged in and now gets a 401, show session expired toast
      if (initialised.current && user !== null) {
        setUser(null);
        toast.error("Your session has expired. Please sign in again.");
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
      initialised.current = true;
    }
  };

  useEffect(() => {
    const onAuthPage = typeof window !== "undefined" && window.location.pathname.startsWith("/auth/");
    if (onAuthPage) { setLoading(false); return; }
    fetchMe();
  }, []);

  const logout = async () => {
    if (AUTH_DISABLED) return;
    await authApi.logout();
    setUser(null);
    clearPersistedCache("anon");
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
