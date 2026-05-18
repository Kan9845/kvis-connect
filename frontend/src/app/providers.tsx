"use client";
import { ThemeProvider } from "next-themes";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { QueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { makePersister, clearPersistedCache, purgeStaleNamespaces } from "@/lib/cache/persister";
import { STALE } from "@/lib/cache/keys";

if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
  require("@/lib/mock");
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE.static,
        gcTime: 24 * 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  });
}

// Inner component — lives inside AuthProvider so useAuth() works.
// Keyed by userId in layout so it fully remounts on login/logout, giving a fresh client + namespace.
function RQProviders({ userId, children }: { userId: string | "anon"; children: React.ReactNode }) {
  const prevUserIdRef = useRef<string | "anon">(userId);
  // Stable client for this mount lifetime.
  const [queryClient] = useState(makeQueryClient);

  useEffect(() => {
    purgeStaleNamespaces();
  }, []);

  useEffect(() => {
    const prev = prevUserIdRef.current;
    if (prev !== userId && prev !== "anon") {
      // User logged out — clear their persisted namespace.
      clearPersistedCache(prev);
    }
    prevUserIdRef.current = userId;
  }, [userId]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: makePersister(userId),
        maxAge: 24 * 60 * 60 * 1000,
        buster: "v1",
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

// Bridge: reads userId from AuthContext (requires being inside AuthProvider).
function RQProvidersBridge({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? "anon";
  return (
    <RQProviders key={String(userId)} userId={userId}>
      {children}
    </RQProviders>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
    </ThemeProvider>
  );
}

export { RQProvidersBridge as RQProviders };
