import type { SearchParams } from "@/lib/types";

// Centralised query key factory. Always go through this so invalidation can
// fan out reliably (e.g. invalidating keys.blog.all() catches every blog list
// variant).

export const keys = {
  me: () => ["me"] as const,

  user: {
    all: () => ["user"] as const,
    detail: (slug: string) => ["user", slug] as const,
  },

  blog: {
    all: () => ["blogs"] as const,
    list: (params?: { tag?: string; limit?: number; offset?: number }) =>
      params ? (["blogs", "list", params] as const) : (["blogs", "list"] as const),
    detail: (slug: string) => ["blog", slug] as const,
  },

  search: {
    all: () => ["search"] as const,
    query: (params: SearchParams) => ["search", params] as const,
  },

  globe: {
    pins: () => ["globe-pins"] as const,
  },

  summary: () => ["summary"] as const,

  stats: {
    alumni: () => ["alumni", "stats", "all"] as const,
  },

  yearbook: {
    all: () => ["yearbook-all"] as const,
  },
} as const;

// Stale-time presets (ms). Tuned to stay at-or-under backend Redis TTLs
// (short=120s, long=300s) so the frontend never holds data older than the
// backend's own cache. See docs/superpowers/specs/2026-05-17-backend-redis-cache-design.md.
export const STALE = {
  volatile: 30_000,        // detail page the user is reading
  static: 2 * 60_000,      // lists, search results (matches backend short TTL)
  long: 5 * 60_000,        // globe pins, summary (matches backend long TTL)
} as const;
