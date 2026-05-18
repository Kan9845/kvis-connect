import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { Persister } from "@tanstack/react-query-persist-client";

const CACHE_VERSION = "v1";

function namespacedKey(userId: string | "anon") {
  return `kvis-cache:${CACHE_VERSION}:user-${userId}`;
}

export function makePersister(userId: string | "anon"): Persister {
  return createSyncStoragePersister({
    storage: typeof window === "undefined" ? undefined : window.localStorage,
    key: namespacedKey(userId),
    throttleTime: 1_000,
  });
}

// Clear every namespace older than this version, plus the current key when
// explicitly requested (e.g. logout). Cheap because localStorage is small.
export function clearPersistedCache(userId: string | "anon") {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(namespacedKey(userId));
  } catch {
    // localStorage may be unavailable (private mode); ignore.
  }
}

export function purgeStaleNamespaces() {
  if (typeof window === "undefined") return;
  try {
    const prefix = `kvis-cache:`;
    const currentPrefix = `kvis-cache:${CACHE_VERSION}:`;
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefix) && !k.startsWith(currentPrefix)) {
        window.localStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
}
