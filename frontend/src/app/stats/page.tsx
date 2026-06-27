import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/cache/getQueryClient";
import { keys } from "@/lib/cache/keys";
import type { UserCard } from "@/lib/types";
import StatsClient from "./StatsClient";

const API =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

async function getStatsPeople(): Promise<UserCard[]> {
  try {
    const res = await fetch(
      `${API}/api/search?sort=kvis_year&order=asc&limit=1000`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function StatsPage() {
  const qc = getQueryClient();
  const people = await qc.fetchQuery({
    queryKey: keys.stats.alumni(),
    queryFn: getStatsPeople,
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <StatsClient initialPeople={people} />
    </HydrationBoundary>
  );
}
