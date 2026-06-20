"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

const ADMIN_SLUGS = [
    "surapa-panjaphakdee",
    "chayada-pakpoomkamonlert",
    "naruesorn-prabpon",
    "popsuk-sumetchoengprachya",
    "suchart-udomchai",
];

const TYPE_COLORS: Record<string, string> = {
  bug: "oklch(55% 0.2 25)",
  feature: "var(--kvis-purple-light)",
  suggestion: "var(--kvis-green-light)",
  kind_words: "oklch(65% 0.15 150)",
};

type FeedbackItem = {
  id: string;
  type: string;
  message: string;
  contact_email?: string;
  user_id?: string;
  created_at: string;
};

export default function FeedbackAdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || !ADMIN_SLUGS.includes(user.slug)) {
      router.replace("/");
      return;
    }
    api
      .get("/api/feedback")
      .then((r) => setItems(r.data))
      .catch(() => setError("Failed to load feedback."))
      .finally(() => setFetching(false));
  }, [user, loading, router]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  const counts = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.type] = (acc[i.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div
      className="mx-auto max-w-4xl px-4 md:px-6 py-12"
      style={{ fontFamily: "var(--font-be-vietnam-pro), sans-serif" }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.3em] mb-2 text-[var(--kvis-green-light)]">
        Admin
      </p>
      <h1 className="font-display text-4xl font-black tracking-tight mb-1">
        <span className="font-light">Feedback</span>{" "}
        <span style={{ color: "var(--kvis-purple)" }}>Inbox</span>
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        {items.length} submissions total &mdash;{" "}
        {Object.entries(counts)
          .map(([k, v]) => `${v} ${k.replace("_", " ")}`)
          .join(", ")}
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No feedback yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="border border-[var(--kvis-border)] p-5 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-4">
                <span
                  className="text-xs font-bold uppercase tracking-[0.18em]"
                  style={{ color: TYPE_COLORS[item.type] ?? "var(--kvis-text3)" }}
                >
                  {item.type.replace("_", " ")}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-[var(--kvis-ink)]">
                {item.message}
              </p>
              {(item.contact_email || item.user_id) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                  {item.contact_email && <span>✉ {item.contact_email}</span>}
                  {item.user_id && <span>uid: {item.user_id}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}