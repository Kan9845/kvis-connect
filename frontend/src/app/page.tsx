import { LandingClient } from "./LandingClient";
import type { GlobePin, Summary, BlogRead } from "@/lib/types";

export const dynamic = "force-dynamic";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getPins(): Promise<GlobePin[]> {
  try {
    const res = await fetch(`${API}/api/users/globe/pins`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getSummary(): Promise<Summary | null> {
  try {
    const res = await fetch(`${API}/api/summary`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getInitialPosts(): Promise<BlogRead[]> {
  try {
    const res = await fetch(`${API}/api/blogs?limit=2`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [pins, summary, initialPosts] = await Promise.all([
    getPins(),
    getSummary(),
    getInitialPosts(),
  ]);

  return (
    <LandingClient
      initialPins={pins}
      initialSummary={summary}
      initialPosts={initialPosts}
    />
  );
}
