"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AuthShell, P, FieldLabel, editorialInputClass } from "../AuthShell";

const INPUT_BORDER = "oklch(35% 0.005 294)";
const INPUT_BORDER_FOCUS = "oklch(78% 0.01 294)";

export default function RegisterPage() {
  const { user, loading, refetch } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user?.email_verified) router.replace("/");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: P.text3 }} />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      await refetch();
      router.replace("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const focusable = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = INPUT_BORDER_FOCUS;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = INPUT_BORDER;
    },
  };

  return (
    <AuthShell
      numeral="02"
      kicker="Register · KVIS alumni only"
      title="Join the masthead."
      lede="Open an account with your name and a working email. You can verify your @kvis.ac.th address afterwards to unlock the KVIS-Verified badge."
      footer={
        <span>
          Already a member?{" "}
          <Link
            href="/auth/login"
            className="font-bold uppercase tracking-[0.18em] text-foreground hover:underline underline-offset-[5px]"
            style={{ textDecorationColor: P.purple }}
          >
            Sign in →
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>First name</FieldLabel>
            <input
              id="firstName"
              placeholder="Ada"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
              className={editorialInputClass}
              style={{ borderColor: INPUT_BORDER }}
              {...focusable}
            />
          </div>
          <div>
            <FieldLabel>Last name</FieldLabel>
            <input
              id="lastName"
              placeholder="Lovelace"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoComplete="family-name"
              className={editorialInputClass}
              style={{ borderColor: INPUT_BORDER }}
              {...focusable}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Email</FieldLabel>
          <input
            id="email"
            type="email"
            placeholder="you@kvis.ac.th"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={editorialInputClass}
            style={{ borderColor: INPUT_BORDER }}
            {...focusable}
          />
        </div>

        <div>
          <FieldLabel hint={<span className="text-[10px] tabular-nums" style={{ color: P.text3 }}>min. 8 chars</span>}>
            Password
          </FieldLabel>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className={editorialInputClass}
            style={{ borderColor: INPUT_BORDER }}
            {...focusable}
          />
        </div>

        <div>
          <FieldLabel>Confirm password</FieldLabel>
          <input
            id="confirm"
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            className={editorialInputClass}
            style={{ borderColor: INPUT_BORDER }}
            {...focusable}
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
          disabled={submitting}
          className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-none bg-foreground text-background hover:bg-foreground/90 transition-colors text-xs uppercase tracking-[0.28em] font-bold disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Create account
        </button>
      </form>
    </AuthShell>
  );
}
