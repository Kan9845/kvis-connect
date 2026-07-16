"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

const FEEDBACK_PERMISSION = "admin.feedback.read";

const TYPE_COLORS: Record<string, string> = {
  bug: "#b42318",
  feature: "#6941c6",
  suggestion: "#347a45",
  kind_words: "#147d64",
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
    if (!user) {
      router.replace("/auth/login?next=/admin/feedback");
      return;
    }
    if (!user.permissions.includes(FEEDBACK_PERMISSION)) {
      setError("You do not have permission to view feedback.");
      setFetching(false);
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
      <div className="flex min-h-screen items-center justify-center bg-[var(--admin-canvas)] text-sm text-[#657064]">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--admin-canvas)] px-4 text-center text-sm text-[#b42318]">
        {error}
      </div>
    );
  }

  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div
      className="min-h-screen bg-[var(--admin-canvas)] px-4 py-12 text-[#17251d] transition-colors duration-200 md:px-6"
      style={{ colorScheme: "light", fontFamily: "var(--font-be-vietnam-pro), sans-serif" }}
    >
      <div className="mx-auto max-w-4xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-[#52714f]">Admin / Inbox</p>
        <h1 className="mb-1 font-display text-4xl font-black tracking-tight md:text-5xl">
          <span className="font-light">Feedback</span>{" "}
          <span className="text-[#6941c6]">Inbox</span>
        </h1>
        <p className="mb-8 text-sm text-[#657064]">
          {items.length} submissions total &mdash; {Object.entries(counts)
            .map(([key, value]) => `${value} ${key.replace("_", " ")}`)
            .join(", ")}
        </p>

        {items.length === 0 ? (
          <div className="border border-[#17251d]/15 bg-[#faf8f3] px-5 py-12 text-center text-sm italic text-[#657064]">
            No feedback yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-3 border border-[#17251d]/15 bg-[#faf8f3] p-5 shadow-[0_8px_24px_rgba(23,37,29,0.04)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <span
                    className="text-xs font-bold uppercase tracking-[0.18em]"
                    style={{ color: TYPE_COLORS[item.type] ?? "#657064" }}
                  >
                    {item.type.replace("_", " ")}
                  </span>
                  <span className="text-xs tabular-nums text-[#657064]">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium leading-relaxed text-[#294230]">{item.message}</p>
                {(item.contact_email || item.user_id) && (
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#657064]">
                    {item.contact_email && <span>Contact: {item.contact_email}</span>}
                    {item.user_id && <span>UID: {item.user_id}</span>}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
