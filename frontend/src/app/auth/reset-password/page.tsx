"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import { authApi } from "@/lib/api";
import { AuthShell, P, FieldLabel, editorialInputClass } from "../AuthShell";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full flex items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: P.text3 }} />
        </div>
      }
    >
      <ResetInner />
    </Suspense>
  );
}

function ResetInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) router.replace("/auth/forgot");
  }, [token, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPw.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setError("Passwords don't match."); return; }
    setSubmitting(true);
    try {
      await authApi.confirmPasswordReset(token, newPw);
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Invalid or expired reset link. Request a new one.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) return null;

  return (
    <AuthShell
      numeral="04"
      kicker="Account recovery"
      title="Set a new password."
      lede="Choose a strong password of at least 8 characters."
      footer={
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.18em] text-foreground hover:underline underline-offset-[5px]"
          style={{ textDecorationColor: P.purple }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      }
    >
      {done ? (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center"
              style={{ background: "var(--kvis-green-light)" }}
            >
              <Check className="h-4 w-4 text-background" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Password updated
            </p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your password has been changed. You can now sign in with your new password.
          </p>
          <button
            type="button"
            onClick={() => router.push("/auth/login")}
            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-none bg-foreground text-background hover:bg-foreground/90 transition-colors text-xs uppercase tracking-[0.28em] font-bold"
          >
            Sign in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <FieldLabel>New password</FieldLabel>
            <input
              type="password"
              placeholder="Min. 6 characters"
              value={newPw}
              onChange={(e) => { setNewPw(e.target.value); setError(""); }}
              required
              autoComplete="new-password"
              className={editorialInputClass}
              style={{ borderColor: "var(--sep-input)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--sep-input-focus)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sep-input)")}
            />
          </div>

          <div>
            <FieldLabel>Confirm password</FieldLabel>
            <input
              type="password"
              placeholder="Repeat new password"
              value={confirmPw}
              onChange={(e) => { setConfirmPw(e.target.value); setError(""); }}
              required
              autoComplete="new-password"
              className={editorialInputClass}
              style={{ borderColor: "var(--sep-input)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--sep-input-focus)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sep-input)")}
            />
          </div>

          {error && (
            <p className="text-destructive bg-destructive/10 border border-destructive/30 rounded p-3 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-none bg-foreground text-background hover:bg-foreground/90 transition-colors text-xs uppercase tracking-[0.28em] font-bold disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Update password
          </button>
        </form>
      )}
    </AuthShell>
  );
}
