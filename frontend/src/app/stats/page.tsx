import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/cache/getQueryClient";
import { keys } from "@/lib/cache/keys";
import api from "@/lib/api";
import type { UserCard } from "@/lib/types";
import StatsClient from "./StatsClient";


export default async function StatsPage() {
  const qc = getQueryClient();
  const people = await qc.fetchQuery({
    queryKey: keys.stats.alumni(),
    queryFn: () =>
      api
        .get<UserCard[]>("/api/search", {
          params: { sort: "kvis_year", order: "asc", limit: 1000 },
        })
        .then((r) => r.data),
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <StatsClient initialPeople={people} />
    </HydrationBoundary>
  );
}
