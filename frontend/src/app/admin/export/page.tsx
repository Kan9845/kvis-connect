"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckSquare2, Download, Eye, FileSpreadsheet, Files, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { adminExportApi } from "@/lib/api";
import type { AdminExportField, AdminExportPreview, AdminExportRequest } from "@/lib/types";

const EXPORT_PERMISSION = "admin.data_export.download";
const DEFAULT_EXPORT_BASENAME = "kvis-connect-complete-user-dataset";
const LARGE_EXPORT_BYTES = 50 * 1024 * 1024;

function normalizeCsvBasename(value: string, useDefault = true): string {
  let basename = value.trim()
    .replace(/\.csv$/i, "")
    .replace(/[.<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/[. ]+$/g, "")
    .slice(0, 120);
  if (!basename && useDefault) basename = DEFAULT_EXPORT_BASENAME;
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(basename)) {
    basename = `kvis-${basename}`;
  }
  return basename;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${unit}`;
}

export default function AdminExportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fields, setFields] = useState<AdminExportField[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<AdminExportPreview | null>(null);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [exportBasename, setExportBasename] = useState(DEFAULT_EXPORT_BASENAME);
  const [status, setStatus] = useState<"loading" | "ready" | "working" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login?next=/admin/export");
      return;
    }
    if (!user.permissions.includes(EXPORT_PERMISSION)) {
      setStatus("error");
      setMessage("Your account does not have permission to export data.");
      return;
    }
    adminExportApi.getFields()
      .then((available) => {
        setFields(available);
        setSelected(available.filter((field) => field.default_selected).map((field) => field.key));
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
        setMessage("The export field list could not be loaded.");
      });
  }, [loading, router, user]);

  const categories = fields.reduce<Record<string, AdminExportField[]>>((grouped, field) => {
    (grouped[field.category] ??= []).push(field);
    return grouped;
  }, {});
  const entireCsvSelected = fields.length > 0 && selected.length === fields.length;
  const isWorking = status === "working";

  function selectEntireCsv() {
    setSelected(fields.map((field) => field.key));
    setPreview(null);
    setAcknowledged(false);
    setMessage("");
  }

  function selectCategory(categoryFields: AdminExportField[]) {
    const categoryKeys = categoryFields.map((field) => field.key);
    setSelected((current) => Array.from(new Set([...current, ...categoryKeys])));
    setPreview(null);
    setAcknowledged(false);
    setMessage("");
  }

  function clearCategory(categoryFields: AdminExportField[]) {
    const categoryKeys = new Set(categoryFields.map((field) => field.key));
    setSelected((current) => current.filter((field) => !categoryKeys.has(field)));
    setPreview(null);
    setAcknowledged(false);
    setMessage("");
  }

  function toggleField(key: string) {
    setSelected((current) => current.includes(key) ? current.filter((field) => field !== key) : [...current, key]);
    setPreview(null);
    setAcknowledged(false);
  }

  function requestBody(acknowledgeSensitive: boolean): AdminExportRequest {
    return { fields: selected, include_deleted: includeDeleted, acknowledge_sensitive: acknowledgeSensitive };
  }

  async function loadPreview() {
    if (selected.length === 0) return;
    setStatus("working");
    setMessage("");
    try {
      setPreview(await adminExportApi.preview(requestBody(false)));
      setStatus("ready");
    } catch {
      setStatus("error");
      setMessage("The masked sample could not be generated.");
    }
  }

  async function downloadCsv() {
    if (!acknowledged || !preview || selected.length === 0) return;
    setStatus("working");
    setMessage("");
    try {
      const { blob } = await adminExportApi.download(requestBody(true));
      const safeBasename = normalizeCsvBasename(exportBasename);
      const safeFilename = `${safeBasename}.csv`;
      setExportBasename(safeBasename);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = safeFilename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatus("ready");
      setMessage(`${safeFilename} downloaded and recorded in the audit log.`);
      setAcknowledged(false);
    } catch {
      setStatus("error");
      setMessage("The export failed. No download was created.");
    }
  }

  if (loading || status === "loading") {
    return <div className="min-h-screen bg-[var(--admin-canvas)] p-8 text-sm text-[#657064]">Loading export controls...</div>;
  }
  if (!user || !user.permissions.includes(EXPORT_PERMISSION)) {
    return <div className="min-h-screen bg-[var(--admin-canvas)] p-8 text-sm text-[#b42318]">{message || "Data export is restricted."}</div>;
  }

  return (
    <main className="admin-light-surface min-h-screen bg-[var(--admin-canvas)] px-4 py-8 text-[#17251d] transition-colors duration-200 md:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-[#17251d]/15 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#52714f]">Administration / Data export</p>
            <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.05em] sm:text-5xl">Build a maintenance export.</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#657064]">Select only the fields required for the task. Authentication secrets are never available. Samples are masked, and every completed download is audited.</p>
          </div>
          <Button asChild variant="outline" className="border-[#17251d]/20 bg-transparent text-[#17251d] hover:bg-[#e8e5dc]"><Link href="/admin">Back to dashboard</Link></Button>
        </header>

        <section className={`mt-8 border p-5 md:p-6 ${entireCsvSelected ? "border-[#52714f] bg-[#e7edda]" : "border-[#17251d]/15 bg-[#faf8f3]"}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <Files className="mt-0.5 h-5 w-5 shrink-0 text-[#31583c]" />
              <div>
                <p className="text-sm font-black text-[#17251d]">Complete user dataset for maintenance</p>
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[#657064]">Select all {fields.length} permitted user, education, and career fields in one action. Passwords, tokens, and authentication-provider IDs remain permanently excluded.</p>
              </div>
            </div>
            <Button type="button" onClick={selectEntireCsv} disabled={fields.length === 0 || entireCsvSelected} variant="outline" className="w-full shrink-0 rounded-none border-[#31583c] bg-transparent text-[#31583c] hover:bg-[#dce5cc] disabled:opacity-70 sm:w-auto">
              {entireCsvSelected ? <CheckSquare2 className="mr-2 h-4 w-4" /> : <Files className="mr-2 h-4 w-4" />}
              {entireCsvSelected ? "Complete dataset selected" : "Select complete dataset"}
            </Button>
          </div>
        </section>

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
          <section className="min-w-0 border border-[#17251d]/15 bg-[#faf8f3] p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[#52714f]"><FileSpreadsheet className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[0.22em]">Field selector</span></div>
              <div className="flex gap-3">
                <button type="button" onClick={selectEntireCsv} className="text-xs font-semibold text-[#31583c] underline underline-offset-4">Select all fields</button>
                <button type="button" onClick={() => { setSelected([]); setPreview(null); setAcknowledged(false); setMessage(""); }} className="text-xs font-semibold text-[#657064] underline underline-offset-4">Clear all</button>
              </div>
            </div>
            <p className="mt-3 text-sm text-[#657064]">{selected.length} of {fields.length} fields selected</p>
            <div className="mt-5 space-y-2">
              {Object.entries(categories).map(([category, categoryFields]) => (
                <details key={category} className="group border border-[#17251d]/15 bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 marker:content-none">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-[#35503b]">{category}</span>
                    <span className="flex items-center gap-3 text-[11px] text-[#657064]"><span>{categoryFields.filter((field) => selected.includes(field.key)).length}/{categoryFields.length} selected</span><span className="text-base transition-transform group-open:rotate-45">+</span></span>
                  </summary>
                  <fieldset className="border-t border-[#17251d]/10 bg-[#f7f5ef] p-3">
                    <legend className="sr-only">{category} export fields</legend>
                    <div className="mb-3 flex gap-3">
                      <button type="button" onClick={() => selectCategory(categoryFields)} className="text-[11px] font-semibold text-[#31583c] underline underline-offset-4">Select group</button>
                      <button type="button" onClick={() => clearCategory(categoryFields)} className="text-[11px] font-semibold text-[#657064] underline underline-offset-4">Clear group</button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {categoryFields.map((field) => {
                        const checked = selected.includes(field.key);
                        return (
                          <button key={field.key} type="button" onClick={() => toggleField(field.key)} aria-pressed={checked} className={`flex min-h-16 items-start gap-3 border p-3 text-left transition-colors ${checked ? "border-[#52714f] bg-[#e7edda]" : "border-[#17251d]/15 bg-white hover:border-[#52714f]/50"}`}>
                            {checked ? <CheckSquare2 className="mt-0.5 h-4 w-4 shrink-0 text-[#31583c]" /> : <Square className="mt-0.5 h-4 w-4 shrink-0 text-[#8b9487]" />}
                            <span className="min-w-0"><span className="block text-xs font-bold text-[#17251d]">{field.label}</span><span className="mt-1 block text-[11px] leading-relaxed text-[#657064]">{field.description}</span></span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                </details>
              ))}
            </div>
            <label className="mt-6 flex cursor-pointer items-start gap-3 border border-[#17251d]/15 bg-white p-4 text-sm">
              <input type="checkbox" checked={includeDeleted} onChange={(event) => { setIncludeDeleted(event.target.checked); setPreview(null); setAcknowledged(false); }} className="mt-1 h-4 w-4 accent-[#31583c]" />
              <span><span className="font-bold">Include soft-deleted accounts</span><span className="mt-1 block text-xs text-[#657064]">Off by default. Use only for an approved recovery or audit task.</span></span>
            </label>
          </section>

          <section className="min-w-0 border border-[#17251d]/15 bg-[#faf8f3] p-5 md:p-6 xl:sticky xl:top-6">
            <div className="flex items-center gap-2 text-[#52714f]"><Eye className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[0.22em]">CSV sample</span></div>
            <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.04em]">Review before downloading.</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#657064]">The sample contains up to five rows. Personal values are masked; the downloaded CSV contains the selected source values. A current estimate is required before download.</p>
            <Button onClick={loadPreview} disabled={isWorking || selected.length === 0} className="mt-5 rounded-none bg-[#173b2b] text-white hover:bg-[#28513d]"><Eye className="mr-2 h-4 w-4" />{isWorking && !preview ? "Generating estimate..." : "Generate masked sample"}</Button>
            {selected.length === 0 && <p className="mt-2 text-xs font-semibold text-[#b42318]">Select at least one field before generating the estimate.</p>}

            {preview && (
              <div className="mt-6">
                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  <div className="border border-[#17251d]/15 bg-white p-3"><span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#657064]">Total rows</span><strong className="mt-1 block text-xl text-[#17251d]">{preview.total_rows.toLocaleString()}</strong></div>
                  <div className="border border-[#17251d]/15 bg-white p-3"><span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#657064]">Estimated CSV size</span><strong className="mt-1 block text-xl text-[#17251d]">{formatBytes(preview.estimated_size_bytes)}</strong></div>
                </div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#657064]"><span>Estimate based on up to 25 sampled rows; actual size may vary.</span><span>Showing {preview.rows.length} masked rows</span></div>
                {preview.estimated_size_bytes >= LARGE_EXPORT_BYTES && <div className="mb-3 flex gap-2 border border-[#b76b00]/30 bg-[#fff7e6] p-3 text-xs leading-relaxed text-[#784700]"><AlertTriangle className="h-4 w-4 shrink-0" /><span>Large export warning: this file may take longer to generate and could exceed request time limits. Reduce the selected fields or export in smaller approved batches.</span></div>}
                <div className="w-full max-w-full overflow-auto border border-[#17251d]/15 bg-white xl:max-h-[34rem]">
                  <table className="min-w-max border-collapse text-left font-mono text-xs">
                    <thead className="sticky top-0 bg-[#e7edda] text-[#31583c]"><tr>{preview.columns.map((column) => <th key={column} className="border-b border-r border-[#17251d]/15 px-3 py-2 font-bold">{column}</th>)}</tr></thead>
                    <tbody>{preview.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={`${rowIndex}-${preview.columns[columnIndex]}`} className="max-w-56 truncate border-b border-r border-[#17251d]/10 px-3 py-2 text-[#536258]">{value || <span className="text-[#a0a79d]">empty</span>}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-6 border border-[#17251d]/15 bg-white p-4">
              <label htmlFor="export-filename" className="text-xs font-black uppercase tracking-[0.16em] text-[#35503b]">Download filename</label>
              <div className="mt-2 flex items-center border border-[#17251d]/20 bg-[#faf8f3] focus-within:border-[#52714f]">
                <FileSpreadsheet className="ml-3 h-4 w-4 shrink-0 text-[#52714f]" />
                <input
                  id="export-filename"
                  type="text"
                  value={exportBasename}
                  maxLength={120}
                  spellCheck={false}
                  onChange={(event) => setExportBasename(normalizeCsvBasename(event.target.value, false))}
                  onBlur={() => setExportBasename((current) => normalizeCsvBasename(current))}
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm text-[#17251d] outline-none"
                  aria-describedby="export-filename-help"
                />
                <span className="self-stretch border-l border-[#17251d]/15 bg-[#e7edda] px-3 py-3 font-mono text-sm font-bold text-[#31583c]" aria-hidden="true">.csv</span>
              </div>
              <p id="export-filename-help" className="mt-2 text-xs leading-relaxed text-[#657064]">Enter only the filename. The locked <span className="font-mono">.csv</span> format cannot be changed.</p>
            </div>

            <div className="mt-4 border border-[#b42318]/25 bg-[#fff3f0] p-4">
              <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#b42318]" /><div><p className="text-sm font-bold text-[#7f1d16]">Sensitive maintenance export</p><p className="mt-1 text-xs leading-relaxed text-[#8d453f]">Store the file securely, share it only with authorized people, and delete it when the maintenance task is complete.</p></div></div>
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-[#61241f]"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 accent-[#b42318]" /><span>I understand this download may contain personal data and will handle it according to the approved maintenance purpose.</span></label>
            </div>
            <Button
              onClick={preview ? downloadCsv : loadPreview}
              disabled={isWorking || selected.length === 0 || Boolean(preview && !acknowledged)}
              className={`mt-5 rounded-none text-white ${preview ? "bg-[#b42318] hover:bg-[#8f1d14]" : "bg-[#173b2b] hover:bg-[#28513d]"}`}
            >
              {preview ? <Download className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {isWorking ? "Working..." : !preview ? "Generate estimate" : entireCsvSelected ? "Download entire CSV" : "Download selected CSV"}
            </Button>
            {message && <p className={`mt-4 text-sm ${status === "error" ? "text-[#b42318]" : "text-[#35503b]"}`}>{message}</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
