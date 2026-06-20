"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Check, KeyRound, Trash2, Link2Off, Mail, X, CornerDownRight } from "lucide-react";
import { authApi, userApi } from "@/lib/api";
import { toast } from "sonner";
import type { UserMe } from "@/lib/types";
import { SectionHead, FieldRow, inputCls } from "./components";

interface TabAccountProps {
  me: UserMe;
  refetch: () => Promise<void>;
  googleStatus: "linked" | "error_taken" | "error_cancelled" | null;
  unlinking: boolean;
  handleUnlinkGoogle: () => Promise<void>;
}

export function TabAccount({
  me,
  refetch,
  googleStatus,
  unlinking,
  handleUnlinkGoogle,
}: TabAccountProps) {
  const router = useRouter();

  // ── Change password ──────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleChangePassword = async () => {
    setPwError("");
    if (!currentPw) { setPwError("Enter your current password."); return; }
    if (newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords don't match."); return; }
    setPwLoading(true);
    try {
      await authApi.changePassword({ current_password: currentPw, new_password: newPw });
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (e: any) {
      setPwError(e?.response?.data?.detail ?? "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleSetPassword = async () => {
    setPwError("");
    if (newPw.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords don't match."); return; }
    setPwLoading(true);
    try {
      await authApi.setPassword({ new_password: newPw });
      setPwSuccess(true);
      setNewPw(""); setConfirmPw("");
      await refetch();
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (e: any) {
      setPwError(e?.response?.data?.detail ?? "Failed to set password.");
    } finally {
      setPwLoading(false);
    }
  };

  // ── Delete account ───────────────────────────────────────────────────────
  const [deletePhase, setDeletePhase] = useState<"idle" | "confirm">("idle");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await userApi.deleteAccount();
      router.push("/auth/login");
    } catch {
      toast.error("Failed to delete account. Try again.");
      setDeleteLoading(false);
    }
  };

  // ── Personal email (secondary login) ──────────────────────
  const [peEmail, setPeEmail] = useState("");
  const [peOtp, setPeOtp] = useState("");
  const [pePhase, setPePhase] = useState<"idle" | "otp">("idle");
  const [peLoading, setPeLoading] = useState(false);
  const [peError, setPeError] = useState("");

  const handleRequestPe = async () => {
    setPeError("");
    const email = peEmail.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setPeError("Enter a valid email address."); return; }
    setPeLoading(true);
    try {
      await authApi.requestPersonalEmail(email);
      setPePhase("otp");
      toast.success("Verification code sent.");
    } catch (e: any) {
      setPeError(e?.response?.data?.detail ?? "Failed to send code.");
    } finally {
      setPeLoading(false);
    }
  };

  const handleVerifyPe = async () => {
    setPeError("");
    if (peOtp.trim().length < 6) { setPeError("Enter the 6-digit code."); return; }
    setPeLoading(true);
    try {
      await authApi.verifyPersonalEmail(peEmail.trim().toLowerCase(), peOtp.trim());
      toast.success("Personal email added.");
      setPeEmail(""); setPeOtp(""); setPePhase("idle");
      await refetch();
    } catch (e: any) {
      setPeError(e?.response?.data?.detail ?? "Invalid code.");
    } finally {
      setPeLoading(false);
    }
  };

  const handleRemovePe = async () => {
    setPeLoading(true);
    try {
      await authApi.removePersonalEmail();
      toast.success("Personal email removed.");
      await refetch();
    } catch {
      toast.error("Failed to remove personal email.");
    } finally {
      setPeLoading(false);
    }
  };

  const hasPassword = !!me.has_password;
  const hasGoogle = !!me.google_id;

  return (
    <section>
      {/* ── I. Login methods ──────────────────────────────────────────────── */}
      <SectionHead numeral="I." kicker="Auth" title="Login methods" />

      {/* Email row */}
      <div
        className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-6 gap-y-2 py-5"
      >
        <div className="md:pt-2">
          <span className="text-xs uppercase tracking-[0.24em] font-bold text-[var(--kvis-text3)]">
            Email
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <span className="text-sm text-foreground">{me.email}</span>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.22em] px-2 py-0.5"
            style={{
              background: "var(--kvis-green-light)",
              color: "var(--background)",
            }}
          >
            Active
          </span>
        </div>
      </div>

      {/* Google row */}
      <div
        className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-6 gap-y-2 py-5"
      >
        <div className="md:pt-2">
          <span className="text-xs uppercase tracking-[0.24em] font-bold text-[var(--kvis-text3)]">
            Google
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {hasGoogle ? (
            <>
              <span className="text-sm text-foreground">Connected</span>
              <button
                type="button"
                onClick={handleUnlinkGoogle}
                disabled={unlinking}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[var(--kvis-text3)] hover:text-foreground transition-colors disabled:opacity-40"
              >
                {unlinking ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Link2Off className="h-3 w-3" />
                )}
                Unlink
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">Not connected</span>
              <button
                type="button"
                onClick={() => authApi.linkGoogle()}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-foreground bg-background border border-[var(--kvis-border)] px-3.5 py-2 hover:border-foreground transition-colors"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.07H2.18a11 11 0 0 0 0 9.87l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                </svg>
                Link Google
              </button>
            </>
          )}
        </div>
        {googleStatus === "linked" && (
          <p className="md:col-start-2 text-xs font-semibold text-[var(--kvis-green-light)] mt-1">
            Google account linked successfully.
          </p>
        )}
        {googleStatus === "error_taken" && (
          <p className="md:col-start-2 text-xs font-semibold text-destructive mt-1">
            That Google account is already linked to another user.
          </p>
        )}
      </div>

      {/* Personal email row */}
      <div
        className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-6 gap-y-2 py-5"
      >
        <div className="md:pt-2">
          <span className="text-xs uppercase tracking-[0.24em] font-bold text-[var(--kvis-text3)]">
            Personal email
          </span>
        </div>
        <div>
          {me.personal_email ? (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm text-foreground">{me.personal_email}</span>
              <button
                type="button"
                onClick={handleRemovePe}
                disabled={peLoading}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[var(--kvis-text3)] hover:text-foreground transition-colors disabled:opacity-40"
              >
                {peLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                Remove
              </button>
            </div>
          ) : pePhase === "idle" ? (
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
              <div className="flex-1 min-w-0 md:max-w-md flex flex-col gap-1.5">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={peEmail}
                  onChange={(e) => { setPeEmail(e.target.value); setPeError(""); }}
                  className={`${inputCls} w-full`}
                  autoComplete="email"
                />
                <p className="flex items-start gap-1">
                  <CornerDownRight
                    className="shrink-0 h-3 w-3 mt-0.5 text-[var(--kvis-text3)]"
                    aria-hidden
                  />
                  <span className="text-xs text-[var(--kvis-text3)] leading-[1.5]">
                    Add a secondary email (any domain). Once verified, you can use it to log in with your existing password.
                  </span>
                </p>
              </div>
              <Button
                type="button"
                onClick={handleRequestPe}
                disabled={peLoading}
                className="h-auto w-full md:w-auto justify-center rounded-none bg-foreground px-5 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2 disabled:opacity-40 shrink-0"
              >
                {peLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                Send code
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-md">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enter the 6-digit code sent to <span className="font-semibold text-foreground">{peEmail.trim().toLowerCase()}</span>.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={peOtp}
                  onChange={(e) => { setPeOtp(e.target.value.replace(/\D/g, "")); setPeError(""); }}
                  className={inputCls}
                  autoComplete="one-time-code"
                />
                <Button
                  type="button"
                  onClick={handleVerifyPe}
                  disabled={peLoading}
                  className="h-auto rounded-none bg-foreground px-5 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2 disabled:opacity-40 shrink-0"
                >
                  {peLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Verify
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleRequestPe}
                  disabled={peLoading}
                  className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--kvis-text3)] hover:text-foreground transition-colors disabled:opacity-40"
                >
                  Resend code
                </button>
                <button
                  type="button"
                  onClick={() => { setPePhase("idle"); setPeOtp(""); setPeError(""); }}
                  className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--kvis-text3)] hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {peError && (
            <p className="text-xs font-semibold mt-2 text-[var(--kvis-purple)]">{peError}</p>
          )}
        </div>
      </div>

      {/* ── II. Password ──────────────────────────────────────────────────── */}
      <SectionHead numeral="II." kicker="Security" title="Change password" />

      {hasGoogle && !hasPassword ? (
        <>
          <FieldRow label="New password">
            <Input
              type="password"
              placeholder="Min. 6 characters"
              value={newPw}
              onChange={(e) => { setNewPw(e.target.value); setPwError(""); }}
              className={inputCls}
              autoComplete="new-password"
            />
          </FieldRow>
          <FieldRow label="Confirm password">
            <Input
              type="password"
              placeholder="Repeat new password"
              value={confirmPw}
              onChange={(e) => { setConfirmPw(e.target.value); setPwError(""); }}
              className={inputCls}
              autoComplete="new-password"
            />
          </FieldRow>
          {pwError && (
            <p className="text-xs font-semibold mt-1 mb-3 text-[var(--kvis-purple)]">{pwError}</p>
          )}
          <div className="pt-4 pb-8 border-b" style={{ borderColor: "var(--kvis-border)" }}>
            <Button
              type="button"
              onClick={handleSetPassword}
              disabled={pwLoading || pwSuccess}
              className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2 disabled:opacity-40"
            >
              {pwLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : pwSuccess ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <KeyRound className="h-3.5 w-3.5" />
              )}
              {pwSuccess ? "Password set" : "Set password"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <FieldRow label="Current password">
            <Input
              type="password"
              placeholder="••••••••"
              value={currentPw}
              onChange={(e) => { setCurrentPw(e.target.value); setPwError(""); }}
              className={inputCls}
              autoComplete="current-password"
            />
          </FieldRow>
          <FieldRow label="New password">
            <Input
              type="password"
              placeholder="Min. 6 characters"
              value={newPw}
              onChange={(e) => { setNewPw(e.target.value); setPwError(""); }}
              className={inputCls}
              autoComplete="new-password"
            />
          </FieldRow>
          <FieldRow label="Confirm new">
            <Input
              type="password"
              placeholder="Repeat new password"
              value={confirmPw}
              onChange={(e) => { setConfirmPw(e.target.value); setPwError(""); }}
              className={inputCls}
              autoComplete="new-password"
            />
          </FieldRow>
          {pwError && (
            <p className="text-xs font-semibold mt-1 mb-3 text-[var(--kvis-purple)]">{pwError}</p>
          )}
          <div className="pt-4 pb-8 border-b" style={{ borderColor: "var(--kvis-border)" }}>
            <Button
              type="button"
              onClick={handleChangePassword}
              disabled={pwLoading || pwSuccess}
              className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2 disabled:opacity-40"
            >
              {pwLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : pwSuccess ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <KeyRound className="h-3.5 w-3.5" />
              )}
              {pwSuccess ? "Password updated" : "Update password"}
            </Button>
          </div>
        </>
      )}

      {/* ── III. Danger zone ──────────────────────────────────────────────── */}
      <SectionHead numeral="III." kicker="Danger zone" title="Delete account" />

      <div className="py-5 border-b" style={{ borderColor: "var(--kvis-border)" }}>
        <p className="text-sm text-muted-foreground mb-5 max-w-[60ch] leading-relaxed">
          Permanently deletes your profile, education, career history, and all associated data. This cannot be undone.
        </p>

        {deletePhase === "idle" ? (
          <button
            type="button"
            onClick={() => setDeletePhase("confirm")}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-destructive border border-destructive/40 px-6 py-3 hover:bg-destructive hover:text-white transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete my account
          </button>
        ) : (
          <div
            className="border border-destructive/40 p-5 max-w-sm"
          >
            <p className="text-sm font-semibold text-foreground mb-1">Are you sure?</p>
            <p className="text-xs text-muted-foreground mb-5">
              This is permanent and cannot be reversed.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] bg-destructive text-white px-5 py-2.5 hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Yes, delete
              </button>
              <button
                type="button"
                onClick={() => setDeletePhase("idle")}
                className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--kvis-text3)] hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}