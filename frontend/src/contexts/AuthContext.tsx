"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { userApi, authApi } from "@/lib/api";
import type { UserMe } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

interface AuthContextValue {
  user: UserMe | null;
  loading: boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  // Track whether the initial session check has completed
  const initialised = useRef(false);

  const fetchMe = async () => {
    try {
      const me = await userApi.getMe();
      setUser(me);
    } catch {
      // If user was previously logged in and now gets a 401, show session expired toast
      if (initialised.current && user !== null) {
        setUser(null);
        toast({ title: "Your session has expired. Please sign in again.", variant: "destructive" });
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
      initialised.current = true;
    }
  };

  useEffect(() => { fetchMe(); }, []);

  const logout = async () => {
    await authApi.logout();
    setUser(null);
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
