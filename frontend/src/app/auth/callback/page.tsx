"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dot } from "lucide-react";
import { P } from "../AuthShell";

export default function AuthCallbackPage() {
  const { user, refetch } = useAuth();
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    refetch().finally(() => setDone(true));
  }, []);

  useEffect(() => {
    if (!done) return;

    if (!user) {
      toast.error("Sign-in failed. Please try again.");
      router.replace("/auth/login");
      return;
    }

    router.replace(user.profile_setup_done ? "/" : "/onboarding");
  }, [done, user, router]);

  const issueLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-md px-4 md:px-6 py-24 lg:py-32">
        <div className="flex items-baseline gap-4 mb-6">
          <span
            className="font-mono font-black text-2xl tabular-nums"
            style={{ color: P.green, letterSpacing: "-0.02em" }}
          >
            00
          </span>
          <span
            className="text-[11px] uppercase tracking-[0.32em] font-bold flex items-center gap-1"
            style={{ color: P.text3 }}
          >
            Handshake <Dot className="h-3 w-3 shrink-0" aria-hidden /> OAuth callback
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black tracking-[-0.035em] leading-[0.9] text-foreground max-w-[10ch]">
          Signing you in.
        </h1>

        <p className="mt-6 text-base text-muted-foreground max-w-[42ch] leading-relaxed">
          Verifying your session with Google and reaching back to the desk -
          this only takes a moment.
        </p>

        <div className="mt-12">
          <ProgressTicker />
        </div>

        <div
          className="mt-12 pt-6 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.3em]"
          style={{ borderColor: P.rule, color: P.text3 }}
        >
          <span>KVIS Connect</span>
          <span className="tabular-nums">{issueLabel}</span>
        </div>
      </div>
    </div>
  );
}

function ProgressTicker() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 24), 80);
    return () => clearInterval(id);
  }, []);
  const cells = Array.from({ length: 24 });
  return (
    <div className="flex items-center gap-1.5">
      {cells.map((_, i) => {
        const dist = (i - tick + 24) % 24;
        const lit = dist < 6;
        const intensity = lit ? 1 - dist / 6 : 0.08;
        return (
          <div
            key={i}
            className="h-3 flex-1"
            style={{
              background: `oklch(${30 + intensity * 50}% ${0.05 + intensity * 0.21} 294)`,
              transition: "background 0.18s linear",
            }}
          />
        );
      })}
    </div>
  );
}
