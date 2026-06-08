import { LandingClient } from "./LandingClient";
import type { GlobePin } from "@/lib/types";
import { filterGlobePins } from "@/lib/utils";

export const revalidate = 60;

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getPins(): Promise<GlobePin[]> {
  try {
    const res = await fetch(`${API}/api/users/globe/pins`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return filterGlobePins(await res.json());
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const pins = await getPins();
  return <LandingClient initialPins={pins} />;
}
