"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Check } from "lucide-react";
import { JOB_FIELDS } from "@/lib/constants/options";
import {
  CountrySelect,
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

interface TabCareerProps {
  isSetup: boolean;
  career: Omit<Career, "id">[];
  setCareer: React.Dispatch<React.SetStateAction<Omit<Career, "id">[]>>;
  saveCareer: () => Promise<void>;
}

export function TabCareer({
  isSetup,
  career,
  setCareer,
  saveCareer,
}: TabCareerProps) {
  return (
    <section>
      <SectionHead numeral="I." kicker="Work" title="What you do" />
      {career.length === 0 && (
        <div className="py-10 border-b border-[var(--kvis-border)] text-sm text-muted-foreground italic">
          No positions added yet.
        </div>
      )}
      {career.map((job, i) => (
        <div
          key={i}
          className="py-7 border-b border-[var(--kvis-border)]"
        >
          <div className="flex items-center justify-between mb-4">
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
            <div className="flex items-center gap-4">
              <PrivacyToggle
                value={job.is_public ?? true}
                onChange={(v) =>
                  setCareer((prev) =>
                    prev.map((x, j) =>
                      j === i ? { ...x, is_public: v } : x,
                    ),
                  )
                }
              />
              <button
                type="button"
                onClick={() =>
                  setCareer((prev) => prev.filter((_, j) => j !== i))
                }
                className="text-xs font-bold uppercase tracking-[0.22em] inline-flex items-center gap-1.5 hover:text-foreground transition-colors text-[var(--kvis-text3)]"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>
          <FieldRow label="Job title">
            <Input
              placeholder="e.g. ML Engineer"
              value={job.job_title}
              onChange={(e) =>
                setCareer((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, job_title: e.target.value } : x,
                  ),
                )
              }
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="Employer">
            <Input
              placeholder="e.g. Google"
              value={job.employer}
              onChange={(e) =>
                setCareer((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, employer: e.target.value } : x,
                  ),
                )
              }
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="Company type">
            <Select
              value={job.company_type ?? ""}
              onValueChange={(v) =>
                setCareer((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, company_type: v } : x,
                  ),
                )
              }
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
          <FieldRow label="Industry">
            <Select
              value={job.industry_sector ?? ""}
              onValueChange={(v) =>
                setCareer((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, industry_sector: v } : x,
                  ),
                )
              }
            >
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_SECTORS.map((g) => (
                  <SelectGroup key={g.group}>
                    <SelectLabel>{g.group}</SelectLabel>
                    {g.options.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Role type">
            <Select
              value={job.role_type ?? ""}
              onValueChange={(v) =>
                setCareer((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, role_type: v } : x,
                  ),
                )
              }
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
          <FieldRow label="Field">
            <Select
              value={job.job_field}
              onValueChange={(v) =>
                setCareer((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, job_field: v } : x,
                  ),
                )
              }
            >
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {JOB_FIELDS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Country">
            <CountrySelect
              variant="underline"
              value={job.country}
              onChange={(v) =>
                setCareer((prev) =>
                  prev.map((x, j) =>
                    j === i
                      ? {
                          ...x,
                          country: v,
                          state: CITY_STATE_COUNTRIES.has(v) ? v : "",
                        }
                      : x,
                  ),
                )
              }
            />
          </FieldRow>
          {!CITY_STATE_COUNTRIES.has(job.country) && (
            <FieldRow label="City">
              <CitySelect
                variant="underline"
                country={job.country}
                value={job.state ?? ""}
                onChange={(v) =>
                  setCareer((prev) =>
                    prev.map((x, j) =>
                      j === i ? { ...x, state: v } : x,
                    ),
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
                        ? {
                            ...x,
                            start_year:
                              parseInt(e.target.value) || undefined,
                          }
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
                value={
                  job.is_current
                    ? new Date().getFullYear()
                    : (job.end_year ?? "")
                }
                disabled={job.is_current}
                onChange={(e) =>
                  setCareer((prev) =>
                    prev.map((x, j) =>
                      j === i
                        ? {
                            ...x,
                            end_year:
                              parseInt(e.target.value) || undefined,
                          }
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
                        j === i
                          ? { ...x, is_current: e.target.checked }
                          : x,
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
            onClick={saveCareer}
            className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2"
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
              {
                job_title: "",
                employer: "",
                job_field: "",
                country: "",
                is_current: false,
                is_public: true,
              },
            ])
          }
          className="h-auto rounded-none border-foreground bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-foreground hover:bg-foreground hover:text-background gap-2"
        >
          <Plus className="h-3.5 w-3.5" /> Add entry
        </Button>
      </div>
    </section>
  );
}
