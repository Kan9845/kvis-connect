"use client";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { AuthShell, P, FieldLabel, editorialInputClass } from "../AuthShell";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full flex items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: P.text3 }} />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const { user, loading, refetch } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.email_verified) router.replace(next);
  }, [user, router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authApi.login({ email, password });
      await refetch();
      router.replace(next);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (msg === "EMAIL_NOT_VERIFIED") {
        router.push(`/auth/register?email=${encodeURIComponent(email)}&step=verify`);
        return;
      }
      setError(msg ?? "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      numeral="01"
      kicker="Sign in · Returning member"
      title="Welcome back to the network."
      lede="The alumni network for KVIS - profiles, maps, and a directory that follows you around the world."
      footer={
        <div className="flex items-center justify-between gap-6">
          <span>No account yet?</span>
          <Link
            href="/auth/register"
            className="font-bold uppercase tracking-[0.18em] text-foreground hover:underline underline-offset-[5px]"
            style={{ textDecorationColor: P.purple }}
          >
            Register <ArrowRight className="h-3.5 w-3.5 ml-1 inline" />
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        <div>
          <FieldLabel>Email</FieldLabel>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={editorialInputClass}
            style={{ borderColor: "oklch(35% 0.005 294)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "oklch(78% 0.01 294)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "oklch(35% 0.005 294)")}
          />
        </div>

        <div>
          <FieldLabel
            hint={
              <Link
                href="/auth/forgot"
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: P.text3 }}
              >
                Forgot?
              </Link>
            }
          >
            Password
          </FieldLabel>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className={editorialInputClass}
            style={{ borderColor: "oklch(35% 0.005 294)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "oklch(78% 0.01 294)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "oklch(35% 0.005 294)")}
          />
        </div>

        {error && (
          <p
            className="text-xs font-medium uppercase tracking-[0.18em] py-2 px-3"
            style={{
              color: "oklch(70% 0.18 25)",
              background: "oklch(20% 0.04 25)",
              border: "1px solid oklch(40% 0.12 25)",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || loading}
          className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-none bg-foreground text-background hover:bg-foreground/90 transition-colors text-xs uppercase tracking-[0.28em] font-bold disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Sign in
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: P.rule }} />
          <span
            className="text-[10px] font-bold uppercase tracking-[0.32em]"
            style={{ color: P.text3 }}
          >
            or
          </span>
          <div className="flex-1 h-px" style={{ background: P.rule }} />
        </div>

        <button
          type="button"
          onClick={() => authApi.googleLogin()}
          className="w-full h-12 inline-flex items-center justify-center gap-3 rounded-none border bg-transparent text-foreground hover:bg-foreground/[0.04] transition-colors text-xs uppercase tracking-[0.24em] font-bold"
          style={{ borderColor: "oklch(40% 0.005 294)" }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
      </form>
    </AuthShell>
  );
}
