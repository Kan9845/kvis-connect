"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { editorialInputClass } from "../AuthShell";
import { saveVerificationRequest } from "@/lib/verificationRequests";

type Step = "identity" | "details" | "submitted";
type InputRefs = React.MutableRefObject<Array<HTMLInputElement | null>>;

export default function JoinPage() {
  const [step, setStep] = useState<Step>("identity");
  const [forgot, setForgot] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [cohort, setCohort] = useState("");
  const [fullName, setFullName] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const studentIdRefs = useRef<Array<HTMLInputElement | null>>([]);
  const cohortRefs = useRef<Array<HTMLInputElement | null>>([]);

  function updateDigits(value: string, index: number, length: number, current: string, setter: (value: string) => void, refs: InputRefs) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = current.split("");
    next[index] = digit;
    setter(next.join("").slice(0, length));
    setError("");
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, current: string, refs: InputRefs, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !current[index] && index > 0) refs.current[index - 1]?.focus();
  }

  function handlePaste(length: number, setter: (value: string) => void, refs: InputRefs, event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    setter(pasted);
    setError("");
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  function continueFromIdentity(event: React.FormEvent) {
    event.preventDefault();
    if (!forgot && (!/^\d{5}$/.test(studentId) || !/^\d{2}$/.test(cohort))) {
      setError("Enter all five student ID digits and both cohort digits.");
      return;
    }
    if (forgot && !/^\d{2}$/.test(cohort)) {
      setError("Enter both cohort digits.");
      return;
    }
    setError("");
    setStep("details");
  }

  function submitRequest(event: React.FormEvent) {
    event.preventDefault();
    if (!fullName.trim() || !personalEmail.trim()) {
      setError("Enter your full name and personal email.");
      return;
    }
    saveVerificationRequest({ id: crypto.randomUUID(), studentId: forgot ? "" : studentId, cohort, fullName: fullName.trim(), personalEmail: personalEmail.trim().toLowerCase(), note: note.trim(), status: "pending", createdAt: new Date().toISOString() });
    setError("");
    setStep("submitted");
  }

  return <div className="min-h-full bg-background px-4 py-10 md:px-6 md:py-16">
    <main className="mx-auto max-w-xl">
      <div className="mb-10 flex items-center justify-between gap-4 border-b border-foreground/15 pb-5">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">KVIS Connect</span>
        <Link href="/auth/login" className="text-sm font-semibold underline underline-offset-4">Sign in <span aria-hidden="true">&#8599;</span></Link>
      </div>

      {step === "submitted" ? <Submitted fullName={fullName} personalEmail={personalEmail} studentId={studentId} cohort={cohort} /> : step === "details" ? (
        <section>
          <button type="button" onClick={() => { setStep("identity"); setError(""); }} className="mb-6 inline-flex items-center gap-2 text-sm underline underline-offset-4"><ArrowLeft size={14} /> Back</button>
          <h1 className="text-3xl font-bold tracking-tight">Tell us how to reach you.</h1>
          <p className="mb-7 mt-3 text-sm leading-relaxed text-muted-foreground">Use a personal email you can access. The admin team will use these details to review your identity.</p>
          <form onSubmit={submitRequest} className="space-y-5">
            <label className="block text-sm font-medium">Full name<input required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className={`${editorialInputClass} mt-2 border-foreground/25 focus:border-foreground`} placeholder="Your name while studying at KVIS" /></label>
            <label className="block text-sm font-medium">Personal email<input required type="email" autoComplete="email" value={personalEmail} onChange={(event) => setPersonalEmail(event.target.value)} className={`${editorialInputClass} mt-2 border-foreground/25 focus:border-foreground`} placeholder="you@example.com" /></label>
            <label className="block text-sm font-medium">Additional information <span className="font-normal text-muted-foreground">(optional)</span><textarea value={note} onChange={(event) => setNote(event.target.value)} className={`${editorialInputClass} mt-2 min-h-24 resize-y border-foreground/25 focus:border-foreground`} placeholder="Anything that may help the admin verify you" /></label>
            {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
            <button type="submit" className="flex w-full items-center justify-between bg-foreground px-5 py-4 font-semibold text-background transition-opacity hover:opacity-80">Send for admin approval<ArrowRight size={18} /></button>
          </form>
        </section>
      ) : <section>
        <h1 className="text-3xl font-bold tracking-tight">{forgot ? "Let's find your KVIS record." : "First, your student ID."}</h1>
        <p className="mb-7 mt-3 text-sm leading-relaxed text-muted-foreground">The verification is in progress within one day.</p>
        <form onSubmit={continueFromIdentity} className="space-y-5">
          <div className="text-sm font-medium">
            <div className="mt-3 flex items-end gap-4 sm:gap-7">
              {!forgot && <DigitGroup label="Student ID" length={5} value={studentId} refs={studentIdRefs} error={!!error} onChange={(index, value) => updateDigits(value, index, 5, studentId, setStudentId, studentIdRefs)} onKeyDown={(index, event) => handleKeyDown(index, studentId, studentIdRefs, event)} onPaste={(event) => handlePaste(5, setStudentId, studentIdRefs, event)} />}
              <DigitGroup label="Cohort" length={2} value={cohort} refs={cohortRefs} error={!!error} onChange={(index, value) => updateDigits(value, index, 2, cohort, setCohort, cohortRefs)} onKeyDown={(index, event) => handleKeyDown(index, cohort, cohortRefs, event)} onPaste={(event) => handlePaste(2, setCohort, cohortRefs, event)} />
            </div>
            <span className="mt-3 block text-xs font-normal text-muted-foreground">{forgot ? "Enter your two-digit KVIS cohort." : "Enter five student ID digits and two cohort digits."}</span>
          </div>
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          <button type="submit" className="flex w-full items-center justify-between bg-foreground px-5 py-4 font-semibold text-background transition-opacity hover:opacity-80">Continue<ArrowRight size={18} /></button>
        </form>
        <button type="button" onClick={() => { setForgot(!forgot); setError(""); setStudentId(""); }} className="mt-6 inline-flex items-center gap-2 text-sm underline underline-offset-4">{forgot && <ArrowLeft size={14} />}{forgot ? "Use my student ID instead" : "I don't remember my student ID"}</button>
      </section>}
      <p className="mt-10 border-t border-foreground/15 pt-5 text-xs text-muted-foreground">Interactive prototype. Requests are saved only in this browser.</p>
    </main>
  </div>;
}

function Submitted({ fullName, personalEmail, studentId, cohort }: { fullName: string; personalEmail: string; studentId: string; cohort: string }) {
  return <section aria-live="polite">
    <CheckCircle2 className="mb-6 h-11 w-11 text-emerald-600" />
    <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">Request received</p>
    <h1 className="text-4xl font-black tracking-tight">Verification is in progress.</h1>
    <p className="mt-5 text-base leading-relaxed text-muted-foreground">Our admin team will review your request within one day. We will contact you at <strong className="text-foreground">{personalEmail}</strong> after the review.</p>
    <div className="mt-8 border border-foreground/20 bg-foreground/5 p-5 text-sm">
      <div className="flex justify-between gap-4"><span className="text-muted-foreground">Name</span><strong>{fullName}</strong></div>
      <div className="mt-3 flex justify-between gap-4"><span className="text-muted-foreground">Student ID</span><strong>{studentId || "Admin will identify"}</strong></div>
      <div className="mt-3 flex justify-between gap-4"><span className="text-muted-foreground">Cohort</span><strong>{cohort}</strong></div>
      <div className="mt-3 flex justify-between gap-4"><span className="text-muted-foreground">Status</span><strong className="text-amber-700">Pending</strong></div>
    </div>
    <p className="mt-6 text-sm text-muted-foreground">After approval, you can create your account and set up your profile.</p>
  </section>;
}

function DigitGroup({ label, length, value, refs, error, onChange, onKeyDown, onPaste }: { label: string; length: number; value: string; refs: InputRefs; error: boolean; onChange: (index: number, value: string) => void; onKeyDown: (index: number, event: React.KeyboardEvent<HTMLInputElement>) => void; onPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void }) {
  return <div><span className="mb-2 block text-xs font-normal uppercase tracking-[0.18em] text-muted-foreground">{label}</span><div className="flex gap-1.5 sm:gap-3" role="group" aria-label={`${length} digit ${label.toLowerCase()}`}>{Array.from({ length }, (_, index) => <input key={index} ref={(element) => { refs.current[index] = element; }} type="text" inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={1} value={value[index] ?? ""} onChange={(event) => onChange(index, event.target.value)} onKeyDown={(event) => onKeyDown(index, event)} onPaste={onPaste} aria-label={`${label} digit ${index + 1}`} aria-invalid={error} className={`${editorialInputClass} !w-10 sm:!w-12 !px-0 !py-4 text-center text-2xl font-semibold ${error ? "border-red-500" : "border-foreground/25 focus:border-foreground"}`} />)}</div></div>;
}
