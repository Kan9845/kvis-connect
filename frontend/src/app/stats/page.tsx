import { StatsClient } from "./StatsClient";
import type { Summary } from "@/lib/types";

export const revalidate = 300;

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getSummary(): Promise<Summary | null> {
  try {
    const res = await fetch(`${API}/api/summary`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function StatsPage() {
  const summary = await getSummary();
  return <StatsClient summary={summary} />;
}
