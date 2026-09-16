"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock3, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { generateActivationLink, readVerificationRequests, updateVerificationStatus, verificationError, type ActivationLink, type VerificationRequest } from "@/lib/verificationRequests";

const fieldClass = "mt-2 block w-full border border-[#17251d]/30 bg-white p-3 text-sm text-[#17251d]";
const buttonClass = "border border-[#17251d]/30 px-4 py-2 text-sm font-semibold disabled:opacity-40";
const displayDate = (value: string) => new Date(/Z$|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`).toLocaleString();

export default function VerificationRequestsPage() {
  const { user, refetch } = useAuth();
  const checkSession = useRef(refetch);
  const [checking, setChecking] = useState(true);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [ids, setIds] = useState<Record<string, string>>({});
  const [links, setLinks] = useState<Record<string, ActivationLink>>({});
  const allowed = !!user?.permissions?.includes("admin.verification.manage");

  useEffect(() => { void checkSession.current().finally(() => setChecking(false)); }, []);
  useEffect(() => {
    if (!allowed) { setRequests([]); setLinks({}); return; }
    let cancelled = false;
    setLoading(true); setError("");
    readVerificationRequests(page).then((data) => {
      if (!cancelled) { setRequests(data.items); setTotal(data.total); setPending(data.pending); }
    }).catch((failure) => { if (!cancelled) setError(verificationError(failure)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [allowed, page]);

  async function refresh() {
    setLoading(true); setError("");
    try { const data = await readVerificationRequests(page); setRequests(data.items); setTotal(data.total); setPending(data.pending); }
    catch (failure) { setError(verificationError(failure)); }
    finally { setLoading(false); }
  }

  async function review(request: VerificationRequest, status: "approved" | "rejected") {
    const note = notes[request.id]?.trim() ?? "";
    const studentId = ids[request.id] ?? request.studentId;
    if (!note) { setError("Add a decision note before approving or rejecting."); return; }
    if (status === "approved" && !/^[0-9]{5}$/.test(studentId)) { setError("Confirm all five student ID digits before approval."); return; }
    setBusy(request.id); setError(""); setMessage("");
    try {
      const updated = await updateVerificationStatus(request.id, status, note, status === "approved" ? studentId : "");
      setRequests((items) => items.map((item) => item.id === updated.id ? updated : item));
      setPending((count) => Math.max(0, count - 1));
      setMessage(status === "approved" ? "Approved. Generate an activation link and email it to the applicant." : "Rejected. No account or activation link was created.");
    } catch (failure) { setError(verificationError(failure)); }
    finally { setBusy(""); }
  }

  async function issue(request: VerificationRequest) {
    if (request.tokenExpiresAt && !window.confirm("Generate a replacement link? Any previous link will stop working.")) return;
    setBusy(request.id); setError(""); setMessage("");
    setLinks((current) => { const next = { ...current }; delete next[request.id]; return next; });
    try {
      const result = await generateActivationLink(request.id);
      setLinks((current) => ({ ...current, [request.id]: result }));
      setRequests((items) => items.map((item) => item.id === request.id ? { ...item, tokenExpiresAt: result.expires_at } : item));
    } catch (failure) { setError(verificationError(failure)); }
    finally { setBusy(""); }
  }

  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setMessage("Copied. Send it only to the applicant's email shown below."); }
    catch { setError("Clipboard unavailable. Select and copy the message in the box instead."); }
  }

  if (checking) return <main className="p-8">Checking reviewer access...</main>;
  if (!user) return <main className="p-8">Sign in with your reviewer account. <Link href="/auth/login?next=/admin/verification-requests" className="underline">Sign in</Link></main>;
  if (!allowed) return <main className="p-8">This account does not have verification reviewer access. Contact the site operator.</main>;

  return <main className="admin-light-surface min-h-full bg-[var(--admin-canvas)] px-4 py-10 text-[#17251d] md:px-8 md:py-14">
    <div className="mx-auto max-w-5xl">
      <Link href={user.permissions?.includes("admin.overview.read") ? "/admin" : "/"} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"><ArrowLeft size={15} /> Back</Link>
      <header className="mb-9 flex flex-col justify-between gap-5 border-b border-[#17251d]/20 pb-7 sm:flex-row sm:items-end">
        <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#597064]">Identity verification</p><h1 className="text-4xl font-black tracking-tight">Approval requests</h1><p className="mt-3 max-w-xl text-sm text-[#597064]">Compare these details with trusted school records. Student ID and shared memories alone are not proof of identity. Check existing accounts before approving.</p></div>
        <div className="flex items-center gap-3 border border-[#17251d]/20 bg-white px-4 py-3"><Clock3 size={18} /><strong className="text-2xl">{pending}</strong><span className="text-xs uppercase tracking-[0.15em]">Pending</span></div>
      </header>
      <div className="mb-5 flex items-center justify-between gap-4"><p className="text-sm">{total} total requests</p><button disabled={!!busy || loading} className={buttonClass} onClick={refresh}>Refresh</button></div>
      {error && <p role="alert" className="mb-5 border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
      {message && <p role="status" className="mb-5 border border-emerald-200 bg-emerald-50 p-4">{message}</p>}
      {loading ? <p role="status">Loading requests...</p> : requests.length === 0 ? <div className="border border-dashed border-[#17251d]/30 bg-white p-10 text-center"><UserCheck className="mx-auto mb-4" /><h2 className="text-xl font-bold">No requests to show</h2></div> : <div className="space-y-5">
        {requests.map((request) => <article key={request.id} className="border border-[#17251d]/20 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-3"><h2 className="break-words text-xl font-bold">{request.fullName}</h2><span className="border border-[#17251d]/20 px-2 py-1 text-xs font-semibold uppercase">{request.status}</span></div>
          <p className="mt-2 break-all text-sm text-[#597064]">{request.personalEmail}</p>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {[["Applicant", request.applicantType === "student" ? "Current student" : "Alumnus"], ["Student ID", request.studentId || "Not remembered"], ["Cohort", request.cohort], ["Submitted", displayDate(request.createdAt)], ["Nickname", request.nickname], [request.applicantType === "student" ? "Current classroom" : "Former classroom", request.classroom], ...(request.applicantType === "student" ? [["Current grade", `Grade ${request.currentGrade}`], ["Homeroom teacher", request.homeroomTeacher]] : [["High school project", request.projectName], ["Advisor", request.advisor]])].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[#597064]">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words font-semibold">{value}</dd></div>)}
          </dl>
          {request.note && <p className="mt-5 whitespace-pre-wrap break-words border-l-2 border-[#173b2b] pl-4 text-sm">{request.note}</p>}
          {request.reviewNote && <p className="mt-5 whitespace-pre-wrap break-words text-sm"><strong>Decision note:</strong> {request.reviewNote}</p>}
          {request.reviewedAt && <p className="mt-2 text-xs text-[#597064]">Reviewed {displayDate(request.reviewedAt)}</p>}
          {request.status === "pending" && <fieldset disabled={!!busy} className="mt-6 space-y-4 border-t border-[#17251d]/15 pt-5">
            <label className="block text-sm font-semibold">Confirmed student ID (required to approve)<input inputMode="numeric" maxLength={5} value={ids[request.id] ?? request.studentId} onChange={(e) => setIds((current) => ({ ...current, [request.id]: e.target.value.replace(/\D/g, "") }))} className={`${fieldClass} max-w-48`} /></label>
            <label className="block text-sm font-semibold">Decision note (required, visible to reviewers)<textarea maxLength={2000} value={notes[request.id] ?? ""} onChange={(e) => setNotes((current) => ({ ...current, [request.id]: e.target.value }))} className={fieldClass} placeholder="What trusted evidence supports this decision?" /></label>
            <div className="flex flex-wrap gap-3"><button onClick={() => review(request, "rejected")} className={buttonClass}>Reject</button><button onClick={() => review(request, "approved")} className={`${buttonClass} bg-[#173b2b] text-white`}>{busy === request.id ? "Saving..." : "Approve"}</button></div>
          </fieldset>}
          {request.status === "approved" && <section className="mt-6 border-t border-[#17251d]/15 pt-5">
            <button disabled={!!busy} onClick={() => issue(request)} className={`${buttonClass} bg-[#173b2b] text-white`}>{busy === request.id ? "Generating..." : request.tokenExpiresAt ? "Generate replacement link" : "Generate activation link"}</button>
            <p className="mt-3 text-xs text-[#597064]">No email is sent automatically. Links expire after 48 hours and can be used only once. Generating a replacement invalidates the previous link.</p>
            {request.tokenExpiresAt && <p className="mt-2 text-xs">Latest link expires: {displayDate(request.tokenExpiresAt)}</p>}
            {links[request.id] && <div className="mt-4 border border-[#17251d]/20 bg-[#f1f5ed] p-4">
              <p className="break-all text-sm font-semibold">Send only to: {links[request.id].recipient}</p>
              <label className="mt-3 block text-sm">Email message<textarea readOnly value={links[request.id].email_message} rows={8} className={fieldClass} onFocus={(e) => e.target.select()} /></label>
              <div className="mt-3 flex flex-wrap gap-3"><button className={buttonClass} onClick={() => copy(links[request.id].activation_url)}>Copy link</button><button className={buttonClass} onClick={() => copy(links[request.id].email_message)}>Copy email message</button></div>
            </div>}
          </section>}
        </article>)}
      </div>}
      <nav aria-label="Request pages" className="mt-6 flex items-center justify-between gap-3"><button disabled={page <= 1 || loading || !!busy} className={buttonClass} onClick={() => { setLinks({}); setPage(page - 1); }}>Previous</button><span className="text-sm">Page {page} of {Math.max(1, Math.ceil(total / 25))}</span><button disabled={page * 25 >= total || loading || !!busy} className={buttonClass} onClick={() => { setLinks({}); setPage(page + 1); }}>Next</button></nav>
      <p className="mt-8 text-xs text-[#597064]">Private reviewer workspace. Do not share applicant details or activation links. Generated links are not stored in this browser after you leave or reload.</p>
    </div>
  </main>;
}
