import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/cache/getQueryClient";
import { keys } from "@/lib/cache/keys";
import api from "@/lib/api";
import type { UserCard } from "@/lib/types";
import StatsClient from "./StatsClient";

export const metadata = {
  title: "By the Numbers · KVIS Connect",
  description:
    "Where KVIS alumni went to study after graduation — faculties, universities, and countries, by cohort.",
};

export default async function StatsPage() {
  const qc = getQueryClient();
  await qc.prefetchQuery({
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
      <StatsClient />
    </HydrationBoundary>
  );
}
