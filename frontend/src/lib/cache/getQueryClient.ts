import { QueryClient } from "@tanstack/react-query";
import { STALE } from "./keys";

// One fresh QueryClient per server request - do not cache this module-level.
export function getQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE.static,
      },
    },
  });
}
