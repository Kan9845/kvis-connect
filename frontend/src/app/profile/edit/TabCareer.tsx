"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Check } from "lucide-react";
import { JOB_FIELDS } from "@/lib/constants/options";
import {
  CountrySelect,
  ProvinceSelect,
  CitySelect,
  CITY_STATE_COUNTRIES,
} from "@/components/ui/location-selects";
import type { Career } from "@/lib/types";
import {
  SectionHead,
  FieldRow,
  PrivacyToggle,
  inputCls,
  selectTriggerCls,
} from "./components";
import { COMPANY_TYPES, INDUSTRY_SECTORS, ROLE_TYPES } from "./constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TabCareerProps {
  isSetup: boolean;
  isDirty: boolean;
  career: Omit<Career, "id">[];
  setCareer: React.Dispatch<React.SetStateAction<Omit<Career, "id">[]>>;
  saveCareer: () => Promise<void>;
}

type CareerErrors = {
  job_title?: string;
  employer?: string;
  company_type?: string;
  industry_sector?: string;
  role_type?: string;
  country?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateCareer(job: Omit<Career, "id">): CareerErrors {
  const errors: CareerErrors = {};
  if (!job.job_title?.trim()) errors.job_title = "Job title is required.";
  if (!job.industry_sector?.trim()) errors.industry_sector = "Industry is required.";
  if (!job.role_type?.trim()) errors.role_type = "Role type is required.";
  return errors;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TabCareer({
  isSetup,
  isDirty,
  career,
  setCareer,
  saveCareer,
}: TabCareerProps) {
  const [errors, setErrors] = useState<Record<number, CareerErrors>>({});

  const handleSave = async () => {
    const newErrors: Record<number, CareerErrors> = {};
    let hasError = false;
    career.forEach((job, i) => {
      const e = validateCareer(job);
      if (Object.keys(e).length > 0) {
        newErrors[i] = e;
        hasError = true;
      }
    });
    setErrors(newErrors);
    if (hasError) return;
    await saveCareer();
    setErrors({});
  };

  const clearError = (i: number, field: keyof CareerErrors) => {
    setErrors((prev) => {
      if (!prev[i]?.[field]) return prev;
      const next = { ...prev };
      next[i] = { ...next[i] };
      delete next[i][field];
      return next;
    });
  };

  return (
    <section>
      <SectionHead numeral="I." kicker="Work" title="What you do" />
      {career.length === 0 && (
        <div className="py-10 border-b border-[var(--kvis-border)] text-sm text-muted-foreground italic">
          No positions added yet.
        </div>
      )}
      {career.map((job, i) => (
        <div key={i} className="py-7 border-b border-[var(--kvis-border)]">
          <div className="flex flex-wrap items-center justify-between gap-y-2 mb-4">
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-mono tabular-nums font-semibold text-[var(--kvis-text3)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)]">
                Position
              </span>
              {job.is_current && (
                <span
                  className="px-1.5 py-0.5 text-xs font-bold uppercase tracking-[0.22em] leading-none text-white"
                  style={{ background: "var(--kvis-green-light)" }}
                >
                  Current
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <PrivacyToggle
                value={job.is_public ?? true}
                onChange={(v) =>
                  setCareer((prev) =>
                    prev.map((x, j) => (j === i ? { ...x, is_public: v } : x)),
                  )
                }
              />
              <button
                type="button"
                onClick={() => setCareer((prev) => prev.filter((_, j) => j !== i))}
                className="text-xs font-bold uppercase tracking-[0.22em] inline-flex items-center gap-1.5 hover:text-foreground transition-colors text-[var(--kvis-text3)]"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>

          <FieldRow label="Job title" required error={errors[i]?.job_title}>
            <Input
              placeholder="e.g. ML Engineer"
              value={job.job_title}
              onChange={(e) => {
                clearError(i, "job_title");
                setCareer((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, job_title: e.target.value } : x,
                  ),
                );
              }}
              className={inputCls}
            />
          </FieldRow>

          <FieldRow label="Employer">
            <Input
              placeholder="e.g. Google"
              value={job.employer}
              onChange={(e) => {
                clearError(i, "employer");
                setCareer((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, employer: e.target.value } : x,
                  ),
                );
              }}
              className={inputCls}
            />
          </FieldRow>

          <FieldRow label="Company type">
            <Select
              value={job.company_type ?? ""}
              onValueChange={(v) => {
                clearError(i, "company_type");
                setCareer((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, company_type: v } : x,
                  ),
                );
              }}
            >
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow label="Industry" required error={errors[i]?.industry_sector}>
            <Select
              value={job.industry_sector ?? ""}
              onValueChange={(v) => {
                clearError(i, "industry_sector");
                setCareer((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, industry_sector: v } : x,
                  ),
                );
              }}
            >
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_SECTORS.map((g, index) => (
                  <React.Fragment key={g.group}>
                    {index > 0 && <SelectSeparator />}
                    <SelectGroup>
                      <SelectLabel>{g.group}</SelectLabel>
                      {g.options.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow label="Role type" required error={errors[i]?.role_type}>
            <Select
              value={job.role_type ?? ""}
              onValueChange={(v) => {
                clearError(i, "role_type");
                setCareer((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, role_type: v } : x,
                  ),
                );
              }}
            >
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="Select role type" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_TYPES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow label="Country">
            <CountrySelect
              variant="underline"
              value={job.country}
              onChange={(v) => {
                clearError(i, "country");
                setCareer((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, country: v, state: "", city: "" } : x,
                  ),
                );
              }}
            />
          </FieldRow>

          {job.country && !CITY_STATE_COUNTRIES.has(job.country) && (
            <FieldRow label="Province / State">
              <ProvinceSelect
                variant="underline"
                country={job.country}
                value={job.state ?? ""}
                onChange={(v) =>
                  setCareer((prev) =>
                    prev.map((x, j) =>
                      j === i ? { ...x, state: v, city: "" } : x,
                    ),
                  )
                }
              />
            </FieldRow>
          )}
          {job.country && !CITY_STATE_COUNTRIES.has(job.country) && (
            <FieldRow label="City">
              <CitySelect
                variant="underline"
                country={job.country}
                province={job.state ?? ""}
                value={job.city ?? ""}
                onChange={(v) =>
                  setCareer((prev) =>
                    prev.map((x, j) => (j === i ? { ...x, city: v } : x)),
                  )
                }
              />
            </FieldRow>
          )}

          <FieldRow label="Years">
            <div className="flex items-center gap-3">
              <Input
                type="number"
                placeholder="From"
                value={job.start_year ?? ""}
                onChange={(e) =>
                  setCareer((prev) =>
                    prev.map((x, j) =>
                      j === i
                        ? { ...x, start_year: parseInt(e.target.value) || undefined }
                        : x,
                    ),
                  )
                }
                className={`${inputCls} w-20`}
              />
              <span className="text-xs font-bold uppercase tracking-[0.2em] shrink-0 text-[var(--kvis-text3)]">
                to
              </span>
              <Input
                type="number"
                placeholder="To"
                value={job.is_current ? new Date().getFullYear() : (job.end_year ?? "")}
                disabled={job.is_current}
                onChange={(e) =>
                  setCareer((prev) =>
                    prev.map((x, j) =>
                      j === i
                        ? { ...x, end_year: parseInt(e.target.value) || undefined }
                        : x,
                    ),
                  )
                }
                className={`${inputCls} w-20 disabled:opacity-40`}
              />
            </div>
          </FieldRow>

          {job.start_year && (
            <FieldRow label="Status">
              <label className="inline-flex items-center gap-2.5 text-sm text-foreground cursor-pointer pt-1.5">
                <input
                  type="checkbox"
                  checked={job.is_current}
                  onChange={(e) =>
                    setCareer((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, is_current: e.target.checked } : x,
                      ),
                    )
                  }
                  className="h-4 w-4 accent-foreground"
                />
                <span>I currently work here</span>
              </label>
            </FieldRow>
          )}
        </div>
      ))}

      <div className="pt-8 flex items-center gap-4 flex-wrap">
        {!isSetup && (
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
            className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="h-3.5 w-3.5" /> Save career
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setCareer((prev) => [
              ...prev,
              { job_title: "", employer: "", country: "", is_current: false, is_public: true },
            ])
          }
          className="h-auto rounded-none border-foreground bg-transparent px-4 py-2.5 text-xs font-bold uppercase tracking-[0.28em] text-foreground hover:bg-foreground hover:text-background gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" /> Add entry
        </Button>
      </div>
    </section>
  );
}