"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { activateAccount, verificationError } from "@/lib/verificationRequests";
import { editorialInputClass } from "../AuthShell";

export default function ActivatePage() {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const tokenRead = useRef(false);
  useEffect(() => {
    if (tokenRead.current) return;
    tokenRead.current = true;
    setToken(new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
    window.history.replaceState(null, "", window.location.pathname);
    setReady(true);
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (new TextEncoder().encode(password).length > 72) { setError("Use a password of at most 72 bytes."); return; }
    setBusy(true);
    setError("");
    try {
      await activateAccount(token, password);
      window.location.assign("/onboarding");
    } catch (failure) { setError(verificationError(failure)); setBusy(false); }
  }

  return <section className="mx-auto max-w-lg px-4 py-12">
    <h1 className="text-3xl font-bold">Activate your KVIS account</h1>
    <p className="mt-3 mb-8 text-muted-foreground">Set your password, then complete your profile.</p>
    {!ready ? <p>Loading...</p> : !/^[A-Za-z0-9_-]{43}$/.test(token) ? <p role="alert">Open the complete activation link from your email. If it has expired or was already used, contact the admin.</p> :
      <form onSubmit={submit} className="space-y-5">
        <label className="block text-sm font-medium">Password<input required type="password" autoComplete="new-password" minLength={12} maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} className={`${editorialInputClass} mt-2 border-foreground/25`} /><span className="mt-2 block text-xs text-muted-foreground">At least 12 characters.</span></label>
        <label className="block text-sm font-medium">Confirm password<input required type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${editorialInputClass} mt-2 border-foreground/25`} /></label>
        {error && <p role="alert" className="text-red-500">{error}</p>}
        <button disabled={busy} className="w-full bg-foreground p-4 font-semibold text-background disabled:opacity-50">{busy ? "Activating..." : "Activate and set up profile"}</button>
      </form>}
    <Link href="/auth/login" className="mt-6 inline-block underline">Already activated? Sign in</Link>
  </section>;
}
