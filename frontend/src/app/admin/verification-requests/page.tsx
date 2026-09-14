"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Clock3, UserCheck, X } from "lucide-react";
import { readVerificationRequests, updateVerificationStatus, type VerificationRequest, type VerificationStatus } from "@/lib/verificationRequests";

export default function VerificationRequestsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);

  useEffect(() => setRequests(readVerificationRequests()), []);

  function review(id: string, status: VerificationStatus) {
    setRequests(updateVerificationStatus(id, status));
  }

  const pending = requests.filter((request) => request.status === "pending").length;

  return <main className="admin-light-surface min-h-full bg-[var(--admin-canvas)] px-4 py-10 text-[#17251d] md:px-8 md:py-14">
    <div className="mx-auto max-w-5xl">
      <Link href="/admin" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"><ArrowLeft size={15} /> Admin dashboard</Link>
      <div className="mb-9 flex flex-col justify-between gap-5 border-b border-[#17251d]/20 pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#597064]">Identity verification</p>
          <h1 className="text-4xl font-black tracking-tight">Approval requests</h1>
          <p className="mt-3 text-sm text-[#597064]">Review requests submitted from the join page in this browser.</p>
        </div>
        <div className="flex items-center gap-3 border border-[#17251d]/20 bg-white px-4 py-3"><Clock3 size={18} /><strong className="text-2xl">{pending}</strong><span className="text-xs uppercase tracking-[0.15em] text-[#597064]">Pending</span></div>
      </div>

      {requests.length === 0 ? <div className="border border-dashed border-[#17251d]/30 bg-white p-10 text-center"><UserCheck className="mx-auto mb-4 text-[#597064]" /><h2 className="text-xl font-bold">No requests yet</h2><p className="mt-2 text-sm text-[#597064]">Submit a prototype request at the join page, then return here.</p><Link href="/auth/join" className="mt-5 inline-block font-semibold underline underline-offset-4">Open join page</Link></div> : <div className="space-y-4">
        {requests.map((request) => <article key={request.id} className="border border-[#17251d]/20 bg-white p-5 md:p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{request.fullName}</h2><Status status={request.status} /></div>
              <p className="text-sm text-[#597064]">{request.personalEmail}</p>
              <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
                <div><dt className="text-xs uppercase tracking-[0.14em] text-[#718178]">Student ID</dt><dd className="mt-1 font-semibold">{request.studentId || "Not provided"}</dd></div>
                <div><dt className="text-xs uppercase tracking-[0.14em] text-[#718178]">Cohort</dt><dd className="mt-1 font-semibold">{request.cohort}</dd></div>
                <div><dt className="text-xs uppercase tracking-[0.14em] text-[#718178]">Submitted</dt><dd className="mt-1 font-semibold">{new Date(request.createdAt).toLocaleString()}</dd></div>
              </dl>
              {request.note && <p className="mt-5 border-l-2 border-[#173b2b] pl-4 text-sm text-[#46584e]">{request.note}</p>}
            </div>
            {request.status === "pending" && <div className="flex shrink-0 gap-2">
              <button onClick={() => review(request.id, "rejected")} className="inline-flex items-center gap-2 border border-[#17251d]/25 px-4 py-2.5 text-sm font-semibold hover:bg-[#17251d]/5"><X size={16} /> Reject</button>
              <button onClick={() => review(request.id, "approved")} className="inline-flex items-center gap-2 bg-[#173b2b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#214d3a]"><Check size={16} /> Approve</button>
            </div>}
          </div>
        </article>)}
      </div>}
      <p className="mt-8 text-xs text-[#718178]">Prototype only. Decisions are stored in this browser and do not change user accounts.</p>
    </div>
  </main>;
}

function Status({ status }: { status: VerificationStatus }) {
  const style = status === "approved" ? "bg-emerald-100 text-emerald-800" : status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800";
  return <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] ${style}`}>{status}</span>;
}
