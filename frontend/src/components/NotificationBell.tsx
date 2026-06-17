"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, X, Check } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifs = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/api/notifications").then(r => r.data),
    refetchInterval: 60_000, // poll every 60s
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch("/api/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = notifs.filter(n => !n.is_read).length;

  function handleClick(n: Notification) {
    markRead.mutate(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--kvis-purple)]" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[59]" onClick={() => setOpen(false)} />
          <div className="fixed right-3 top-16 z-[60] w-[calc(100vw-1.5rem)] max-w-80 border border-[var(--kvis-border)] bg-background shadow-xl rounded-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--kvis-border)]">
              <span className="text-xs font-bold uppercase tracking-[0.24em] text-foreground">
                Notifications {unread > 0 && `(${unread})`}
              </span>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead.mutate()}
                    className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--kvis-text3)] hover:text-foreground transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button type="button" onClick={() => setOpen(false)}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-[var(--kvis-border)]">
              {notifs.length === 0 ? (
                <p className="px-4 py-8 text-xs text-center text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                notifs.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClick(n)}
                    className="w-full text-left px-4 py-3 hover:bg-foreground/5 transition-colors flex items-start gap-3"
                  >
                    {/* Unread dot */}
                    <div className="mt-1.5 shrink-0">
                      {n.is_read ? (
                        <div className="w-2 h-2 rounded-full bg-transparent" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-[var(--kvis-purple)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold leading-tight mb-0.5 ${n.is_read ? "text-muted-foreground" : "text-foreground"}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatDate(n.created_at)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}