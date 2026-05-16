"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AxiosError } from "axios";

const RESEND_COOLDOWN = 60;

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
      toast({ title: "Must be a @kvis.ac.th email", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await authApi.requestOtp(kvisEmail);
      setOtpSent(true);
      setCooldown(RESEND_COOLDOWN);
      toast({ title: `Code sent to ${kvisEmail}` });
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.detail : null;
      toast({ title: msg ?? "Failed to send code", variant: "destructive" });
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
      toast({ title: "KVIS email verified! You're now KVIS-Verified." });
      router.push("/");
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.detail : null;
      toast({ title: msg ?? "Invalid code", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <GraduationCap className="h-7 w-7" />
            KVIS Connect
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <CardTitle>Get KVIS-Verified</CardTitle>
            <CardDescription>
              Verify your @kvis.ac.th email to unlock the KVIS-Verified badge
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {!otpSent ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>KVIS Email</Label>
                  <Input
                    type="email"
                    placeholder="you@kvis.ac.th"
                    value={kvisEmail}
                    onChange={(e) => setKvisEmail(e.target.value)}
                    autoFocus
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={sendOtp}
                  disabled={sending || !kvisEmail}
                >
                  {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send verification code
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <p className="text-sm text-center text-muted-foreground">
                  Code sent to <span className="font-medium text-foreground">{kvisEmail}</span>
                </p>
                <Input
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoFocus
                />
                <Button type="submit" className="w-full" disabled={submitting || otp.length !== 6}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Verify
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Wrong email?{" "}
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(""); }}
                    className="text-primary hover:underline"
                  >
                    Change
                  </button>
                  {" · "}
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={cooldown > 0}
                    className="text-primary hover:underline disabled:opacity-40 disabled:no-underline"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
                  </button>
                </div>
              </form>
            )}

            <p className="text-center text-xs text-muted-foreground pt-1">
              Skip for now —{" "}
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-primary hover:underline"
              >
                continue without verifying
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
