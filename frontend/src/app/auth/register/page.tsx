"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight, ArrowLeft, Mail } from "lucide-react";
import { AuthShell, P, FieldLabel, editorialInputClass } from "../AuthShell";
import { AxiosError } from "axios";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const INPUT_BORDER = "oklch(35% 0.005 294)";
const INPUT_BORDER_FOCUS = "oklch(78% 0.01 294)";
const RESEND_COOLDOWN = 60;

export default function RegisterPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<"form" | "verify">("form");
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Verify step
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.email_verified && step === "form") router.replace("/");
  }, [user, router, step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const focusable = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = INPUT_BORDER_FOCUS;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = INPUT_BORDER;
    },
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setSubmitting(true);
    try {
      await authApi.register({ email, password, first_name: firstName, last_name: lastName });
      setRegisteredEmail(email);
      setCooldown(RESEND_COOLDOWN);
      setStep("verify");
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.detail : null;
      setError(msg ?? "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authApi.verifyEmail(registeredEmail, otp);
      window.location.assign("/onboarding");
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.detail : null;
      setError(msg ?? "Verification failed. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setError("");
    try {
      await authApi.resendVerification(registeredEmail);
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.detail : null;
      setError(msg ?? "Failed to resend code.");
    }
  }

  if (step === "verify") {
    return (
      <AuthShell
        numeral="02"
        kicker="Verify · Check your inbox"
        title="Enter the code we sent."
        lede={`We emailed a 6-digit code to ${registeredEmail}. Enter it below to activate your account.`}
        footer={
          <div className="flex items-center justify-between gap-6">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0}
              className="text-xs font-bold uppercase tracking-[0.18em] disabled:opacity-40 hover:underline underline-offset-[5px]"
              style={{ color: P.text3, textDecorationColor: P.text3 }}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("form"); setOtp(""); setError(""); }}
              className="font-bold uppercase tracking-[0.18em] text-foreground hover:underline underline-offset-[5px]"
              style={{ textDecorationColor: P.purple }}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1 inline" /> Back
            </button>
          </div>
        }
      >
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex items-center gap-3 py-3 px-4 border" style={{ borderColor: "oklch(78% 0.01 294)" }}>
            <Mail className="h-4 w-4 shrink-0" style={{ color: P.purple }} />
            <span className="text-sm text-muted-foreground truncate">{registeredEmail}</span>
          </div>

          <div>
            <FieldLabel>Verification code</FieldLabel>
            <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
              <InputOTPGroup className="w-full">
                {[0,1,2,3,4,5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="flex-1 h-14 text-xl rounded-none border-foreground/20 focus-within:border-foreground/60" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <p
              className="text-xs font-medium uppercase tracking-[0.18em] py-2 px-3"
              style={{ color: "oklch(70% 0.18 25)", background: "oklch(20% 0.04 25)", border: "1px solid oklch(40% 0.12 25)" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || otp.length !== 6}
            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-none bg-foreground text-background hover:bg-foreground/90 transition-colors text-xs uppercase tracking-[0.28em] font-bold disabled:opacity-50"
          >
            Verify account
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      numeral="02"
      kicker="Register · KVIS alumni only"
      title="Add your alumni record."
      lede="Open an account with your @kvis.ac.th email. We'll send a verification code before you can log in."
      footer={
        <div className="flex items-center justify-between gap-6">
          <span>Already a member?</span>
          <Link
            href="/auth/login"
            className="font-bold uppercase tracking-[0.18em] text-foreground hover:underline underline-offset-[5px]"
            style={{ textDecorationColor: P.purple }}
          >
            Sign in <ArrowRight className="h-3.5 w-3.5 ml-1 inline" />
          </Link>
        </div>
      }
    >
      <form onSubmit={handleRegister} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>First name</FieldLabel>
            <input
              placeholder="First name"
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
              placeholder="Last name"
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
            style={{ color: "oklch(70% 0.18 25)", background: "oklch(20% 0.04 25)", border: "1px solid oklch(40% 0.12 25)" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-none bg-foreground text-background hover:bg-foreground/90 transition-colors text-xs uppercase tracking-[0.28em] font-bold disabled:opacity-50"
        >
          Create account
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
        </button>
      </form>
    </AuthShell>
  );
}
