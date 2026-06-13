"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import { authApi } from "@/lib/api";
import { AuthShell, P, FieldLabel, editorialInputClass } from "../AuthShell";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full flex items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: P.text3 }} />
        </div>
      }
    >
      <ForgotInner />
    </Suspense>
  );
}

function ForgotInner() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authApi.requestPasswordReset(email);
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      numeral="03"
      kicker="Account recovery"
      title="Reset your password."
      lede="Enter the email address on your account and we'll send you a reset link."
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
      {sent ? (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center"
              style={{ background: "var(--kvis-green-light)" }}
            >
              <Check className="h-4 w-4 text-background" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Check your inbox
            </p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If <span className="font-mono text-foreground">{email}</span> is
            registered, a reset link has been sent. It expires in 30 minutes.
          </p>
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive it? Check your spam folder, or{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              try again
            </button>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <FieldLabel>Email</FieldLabel>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
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
            Send reset link
          </button>
        </form>
      )}
    </AuthShell>
  );
}
