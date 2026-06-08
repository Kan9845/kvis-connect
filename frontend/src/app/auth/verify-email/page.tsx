"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Dot } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { AuthShell, P, FieldLabel, editorialInputClass } from "../AuthShell";
import { Separator } from "@/components/ui/separator";

const RESEND_COOLDOWN = 60;
const INPUT_BORDER = "var(--sep-input)";
const INPUT_BORDER_FOCUS = "var(--sep-input-focus)";

export default function VerifyKvisPage() {
  const { user, loading, refetch } = useAuth();
  const router = useRouter();

  const [kvisEmail, setKvisEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
    if (!loading && user?.is_verified) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = async () => {
    if (!kvisEmail.toLowerCase().endsWith("@kvis.ac.th")) {
      toast.error("Must be a @kvis.ac.th email");
      return;
    }
    setSending(true);
    try {
      await authApi.requestOtp(kvisEmail);
      setOtpSent(true);
      setCooldown(RESEND_COOLDOWN);
      toast.success(`Code sent to ${kvisEmail}`);
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.detail : null;
      toast.error(msg ?? "Failed to send code");
    } finally {
      setSending(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setSubmitting(true);
    try {
      await authApi.verifyKvis(kvisEmail, otp);
      await refetch();
      toast.success("KVIS email verified! You're now KVIS-Verified.");
      router.push("/");
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.detail : null;
      toast.error(msg ?? "Invalid code");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-full flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: P.text3 }} />
      </div>
    );
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
      numeral="03"
      kicker={<span className="flex items-center gap-1">Verification <Dot className="h-3 w-3 shrink-0" aria-hidden /> School credentials</span>}
      title="Stamp your name with the KVIS seal."
      lede="Confirm ownership of your @kvis.ac.th address to earn the KVIS-Verified badge on your profile, blog posts, and directory card."
      footer={
        <div className="flex items-center justify-between gap-6">
          <span>Not now -</span>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="font-bold uppercase tracking-[0.18em] text-foreground hover:underline underline-offset-[5px]"
            style={{ textDecorationColor: P.purple }}
          >
            Continue without verifying <ArrowRight className="h-3.5 w-3.5 ml-1 inline" />
          </button>
        </div>
      }
    >
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-6">
        <StepDot index="01" label="Email" active={!otpSent} done={otpSent} />
        <Separator className="flex-1 bg-[var(--kvis-rule)]" />
        <StepDot index="02" label="Code" active={otpSent} done={false} />
      </div>

      {!otpSent ? (
        <div className="space-y-6">
          <div>
            <FieldLabel
              hint={
                <span
                  className="text-[10px] uppercase tracking-[0.22em]"
                  style={{ color: P.text3 }}
                >
                  @kvis.ac.th only
                </span>
              }
            >
              KVIS Email
            </FieldLabel>
            <input
              type="email"
              placeholder="you@kvis.ac.th"
              value={kvisEmail}
              onChange={(e) => setKvisEmail(e.target.value)}
              autoFocus
              className={editorialInputClass}
              style={{ borderColor: INPUT_BORDER }}
              {...focusable}
            />
          </div>
          <button
            type="button"
            onClick={sendOtp}
            disabled={sending || !kvisEmail}
            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-none bg-foreground text-background hover:bg-foreground/90 transition-colors text-xs uppercase tracking-[0.28em] font-bold disabled:opacity-50"
          >
            {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Send verification code
          </button>

          <Receipt label="What you'll get">
            <span className="block">A 6-digit one-time code, valid for 10 minutes.</span>
          </Receipt>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <div
            className="px-4 py-3 border flex items-center justify-between"
            style={{ borderColor: P.rule }}
          >
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.28em]"
                style={{ color: P.text3 }}
              >
                Sent to
              </p>
              <p className="font-semibold text-foreground text-sm mt-0.5 break-all">
                {kvisEmail}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
              }}
              className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/70 hover:text-foreground"
            >
              Change
            </button>
          </div>

          <div>
            <FieldLabel>Verification code</FieldLabel>
            <input
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              className="w-full bg-transparent border rounded-none px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono font-bold text-foreground placeholder:text-foreground/15 focus:outline-none transition-colors tabular-nums"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoFocus
              style={{ borderColor: INPUT_BORDER }}
              {...focusable}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || otp.length !== 6}
            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-none bg-foreground text-background hover:bg-foreground/90 transition-colors text-xs uppercase tracking-[0.28em] font-bold disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Verify
          </button>

          <div
            className="flex items-center justify-between pt-1 text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ color: P.text3 }}
          >
            <span>Didn&apos;t receive the code?</span>
            <button
              type="button"
              onClick={sendOtp}
              disabled={cooldown > 0}
              className="text-foreground hover:underline disabled:opacity-40 disabled:no-underline underline-offset-[5px] tabular-nums"
              style={{ textDecorationColor: P.purple }}
            >
              {cooldown > 0 ? `Resend in ${String(cooldown).padStart(2, "0")}s` : "Resend"}
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}

function StepDot({
  index,
  label,
  active,
  done,
}: {
  index: string;
  label: string;
  active: boolean;
  done: boolean;
}) {
  const color = active ? "var(--kvis-purple-light)" : done ? P.green : P.text3;
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span
        className="font-mono font-black text-sm tabular-nums"
        style={{ color, letterSpacing: "-0.02em" }}
      >
        {index}
      </span>
      <span
        className="text-[10px] font-bold uppercase tracking-[0.28em]"
        style={{ color: active ? "oklch(85% 0.04 294)" : P.text3 }}
      >
        {label}
      </span>
    </div>
  );
}

function Receipt({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="border px-4 py-3 mt-2"
      style={{ borderColor: P.rule }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1.5"
        style={{ color: P.text3 }}
      >
        {label}
      </p>
      <div className="text-xs text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  );
}
