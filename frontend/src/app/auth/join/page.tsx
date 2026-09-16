"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { editorialInputClass } from "../AuthShell";
import { saveVerificationRequest, verificationError } from "@/lib/verificationRequests";

type Step = "identity" | "details" | "submitted";
type InputRefs = React.MutableRefObject<Array<HTMLInputElement | null>>;

export default function JoinPage() {
  const [step, setStep] = useState<Step>("identity");
  const [applicantType, setApplicantType] = useState<"alumni" | "student">("alumni");
  const [currentGrade, setCurrentGrade] = useState("");
  const [homeroomTeacher, setHomeroomTeacher] = useState("");
  const [forgot, setForgot] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [cohort, setCohort] = useState("");
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [classroom, setClassroom] = useState("");
  const [projectName, setProjectName] = useState("");
  const [advisor, setAdvisor] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const studentIdRefs = useRef<Array<HTMLInputElement | null>>([]);
  const cohortRefs = useRef<Array<HTMLInputElement | null>>([]);

  function updateDigits(value: string, index: number, length: number, current: string, setter: (value: string) => void, refs: InputRefs) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = Array.from({ length }, (_, i) => current[i] ?? " ");
    next[index] = digit || " ";
    setter(next.join("").slice(0, length));
    setError("");
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, current: string, refs: InputRefs, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !current[index]?.trim() && index > 0) refs.current[index - 1]?.focus();
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
    if (cohort === "00") { setError("Enter a cohort between 01 and 99."); return; }
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

  async function submitRequest(event: React.FormEvent) {
    event.preventDefault();
    if (!fullName.trim() || !personalEmail.trim()) {
      setError("Enter your full name and personal email.");
      return;
    }
    if (![nickname, classroom, ...(applicantType === "student" ? [currentGrade, homeroomTeacher] : [projectName, advisor])].every((value) => value.trim())) {
      setError(applicantType === "student" ? "Enter your nickname, current grade, classroom, and homeroom teacher." : "Enter your nickname, former classroom, high school project name, and project advisor.");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await saveVerificationRequest({ applicantType, currentGrade: applicantType === "student" ? Number(currentGrade) : null, homeroomTeacher: applicantType === "student" ? homeroomTeacher.trim() : "", studentId: forgot ? "" : studentId, cohort, fullName: fullName.trim(), nickname: nickname.trim(), classroom: classroom.trim(), projectName: applicantType === "alumni" ? projectName.trim() : "", advisor: applicantType === "alumni" ? advisor.trim() : "", personalEmail: personalEmail.trim().toLowerCase(), note: note.trim() });
    } catch (failure) {
      setError(verificationError(failure));
      return;
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Help us verify your KVIS story.</h1>
          <p className="mb-7 mt-3 text-sm leading-relaxed text-muted-foreground">{applicantType === "student" ? "Share your current school details." : "Share the details you used while studying at KVIS."} Our admin team will review them to decide on your request. All fields are required unless marked optional.</p>
          <form onSubmit={submitRequest} className="space-y-5">
            <label className="block text-sm font-medium">Full name<input required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className={`${editorialInputClass} mt-2 border-foreground/25 focus:border-foreground`} placeholder="Your name while studying at KVIS" /></label>
            <label className="block text-sm font-medium">Personal email<input required type="email" autoComplete="email" value={personalEmail} onChange={(event) => setPersonalEmail(event.target.value)} className={`${editorialInputClass} mt-2 border-foreground/25 focus:border-foreground`} placeholder="you@example.com" /></label>
            <fieldset className="space-y-5 border-t border-foreground/15 pt-5">
              <legend className="pr-3 text-sm font-semibold">Your time at KVIS</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium">Nickname<input required maxLength={100} autoComplete="nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} className={`${editorialInputClass} mt-2 border-foreground/25 focus:border-foreground`} placeholder="The name your classmates used" /></label>
                <label className="block text-sm font-medium">{applicantType === "student" ? "Current classroom" : "Former classroom"}<input required maxLength={100} value={classroom} onChange={(event) => setClassroom(event.target.value)} className={`${editorialInputClass} mt-2 border-foreground/25 focus:border-foreground`} placeholder="e.g. Grade 12, Room 3" /></label>
              </div>
              {applicantType === "student" ? <>
                <label className="block text-sm font-medium">Current grade<select required value={currentGrade} onChange={(event) => setCurrentGrade(event.target.value)} className={`${editorialInputClass} mt-2 border-foreground/25`}><option value="">Select your grade</option><option value="10">M.4 / Grade 10</option><option value="11">M.5 / Grade 11</option><option value="12">M.6 / Grade 12</option></select></label>
                <label className="block text-sm font-medium">Homeroom teacher<input required maxLength={200} value={homeroomTeacher} onChange={(event) => setHomeroomTeacher(event.target.value)} className={`${editorialInputClass} mt-2 border-foreground/25 focus:border-foreground`} placeholder="Your homeroom teacher's name" /></label>
              </> : <>
              <label className="block text-sm font-medium">High school project name<input required maxLength={300} value={projectName} onChange={(event) => setProjectName(event.target.value)} className={`${editorialInputClass} mt-2 border-foreground/25 focus:border-foreground`} placeholder="Your research project title" /></label>
              <label className="block text-sm font-medium">Project advisor<input required maxLength={200} value={advisor} onChange={(event) => setAdvisor(event.target.value)} className={`${editorialInputClass} mt-2 border-foreground/25 focus:border-foreground`} placeholder="Your advisor's name" /></label>
              </>}
            </fieldset>
            <label className="block text-sm font-medium">Additional information <span className="font-normal text-muted-foreground">(optional)</span><textarea value={note} onChange={(event) => setNote(event.target.value)} className={`${editorialInputClass} mt-2 min-h-24 resize-y border-foreground/25 focus:border-foreground`} placeholder="Anything that may help the admin verify you" /></label>
            {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={submitting} className="flex w-full items-center justify-between bg-foreground px-5 py-4 font-semibold text-background transition-opacity hover:opacity-80 disabled:opacity-50">{submitting ? "Submitting..." : "Send for admin approval"}<ArrowRight size={18} /></button>
          </form>
        </section>
      ) : <section>
        <h1 className="text-3xl font-bold tracking-tight">{forgot ? "Let's find your KVIS record." : "First, your student ID."}</h1>
        <p className="mb-7 mt-3 text-sm leading-relaxed text-muted-foreground">The verification is in progress within one day.</p>
        <form onSubmit={continueFromIdentity} className="space-y-5">
          <fieldset><legend className="mb-3 text-sm font-medium">I am a...</legend><div className="grid grid-cols-2 gap-3">{(["alumni", "student"] as const).map((type) => <label key={type} className={`flex cursor-pointer items-center gap-2 border p-4 text-sm font-semibold ${applicantType === type ? "border-foreground bg-foreground/5" : "border-foreground/25"}`}><input type="radio" name="applicant-type" value={type} checked={applicantType === type} onChange={() => { setApplicantType(type); setError(""); }} />{type === "student" ? "Current student" : "Alumnus"}</label>)}</div></fieldset>
          <div className="text-sm font-medium">
            <div className="mt-3 flex items-end gap-2 sm:gap-7">
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
      <p className="mt-10 border-t border-foreground/15 pt-5 text-xs text-muted-foreground">Your verification details are shared with authorized reviewers.</p>
    </main>
  </div>;
}

function Submitted({ fullName, personalEmail, studentId, cohort }: { fullName: string; personalEmail: string; studentId: string; cohort: string }) {
  return <section aria-live="polite">
    <CheckCircle2 className="mb-6 h-11 w-11 text-emerald-600" />
    <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">Request received</p>
    <h1 className="text-4xl font-black tracking-tight">Thank you for your request.</h1>
    <p className="mt-5 text-base leading-relaxed text-muted-foreground">Our admin team aims to review new requests within one day. If approved, an admin will manually email an activation link to <strong className="text-foreground">{personalEmail}</strong>. If you already have an account or an open request, use sign in or contact the admin.</p>
    <div className="mt-8 border border-foreground/20 bg-foreground/5 p-5 text-sm">
      <div className="flex justify-between gap-4"><span className="text-muted-foreground">Name</span><strong>{fullName}</strong></div>
      <div className="mt-3 flex justify-between gap-4"><span className="text-muted-foreground">Student ID</span><strong>{studentId || "Admin will identify"}</strong></div>
      <div className="mt-3 flex justify-between gap-4"><span className="text-muted-foreground">Cohort</span><strong>{cohort}</strong></div>
    </div>
    <p className="mt-6 text-sm text-muted-foreground">After approval, you can create your account and set up your profile.</p>
  </section>;
}

function DigitGroup({ label, length, value, refs, error, onChange, onKeyDown, onPaste }: { label: string; length: number; value: string; refs: InputRefs; error: boolean; onChange: (index: number, value: string) => void; onKeyDown: (index: number, event: React.KeyboardEvent<HTMLInputElement>) => void; onPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void }) {
  return <div><span className="mb-2 block text-xs font-normal uppercase tracking-[0.18em] text-muted-foreground">{label}</span><div className="flex gap-1 sm:gap-3" role="group" aria-label={`${length} digit ${label.toLowerCase()}`}>{Array.from({ length }, (_, index) => <input key={index} ref={(element) => { refs.current[index] = element; }} type="text" inputMode="numeric" autoComplete="off" maxLength={1} value={value[index]?.trim() ?? ""} onFocus={(event) => event.target.select()} onChange={(event) => onChange(index, event.target.value)} onKeyDown={(event) => onKeyDown(index, event)} onPaste={onPaste} aria-label={`${label} digit ${index + 1}`} aria-invalid={error} className={`${editorialInputClass} !w-8 sm:!w-12 !px-0 !py-4 text-center text-2xl font-semibold ${error ? "border-red-500" : "border-foreground/25 focus:border-foreground"}`} />)}</div></div>;
}
