"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Check } from "lucide-react";
import { DEGREES } from "@/lib/constants/options";
import {
  CountrySelect,
  ProvinceSelect,
  CitySelect,
  CITY_STATE_COUNTRIES,
} from "@/components/ui/location-selects";
import { UniversityCombobox } from "@/components/ui/university-combobox";
import { MajorCombobox } from "@/components/ui/major-combobox";
import type { Education } from "@/lib/types";
import {
  SectionHead,
  FieldRow,
  PrivacyToggle,
  TagPills,
  inputCls,
  selectTriggerCls,
} from "./components";
import {
  MED_SCHOOLS,
  MED_DUAL_TYPES,
  MED_SPECIALTIES,
  MED_DEGREES,
  SCHOLARSHIP_NAMES,
  SCHOLARSHIP_TYPES,
  SCHOLARSHIP_BOND,
} from "./constants";

const FIELDS_OF_STUDY = [
  "Mathematics & Data Science",
  "Computer Science & Software Engineering",
  "Physical Sciences & Engineering",
  "Chemical Sciences & Engineering",
  "Life Sciences & Bioengineering",
  "Earth, Space, & Environmental Sciences",
  "Non-STEM / Humanities / Social Sciences",
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface TabEducationProps {
  isSetup: boolean;
  isDirty: boolean;
  education: Omit<Education, "id">[];
  setEducation: React.Dispatch<React.SetStateAction<Omit<Education, "id">[]>>;
  saveEducation: () => Promise<void>;
}

type EduErrors = {
  uni_name?: string;
  degree?: string;
  field_of_study?: string;
  major?: string;
  med_school?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateEducation(edu: Omit<Education, "id">): EduErrors {
  const errors: EduErrors = {};
  if (!edu.uni_name?.trim()) errors.uni_name = "University is required.";
  if (!edu.degree?.trim()) errors.degree = "Degree is required.";
  if (!MED_DEGREES.includes(edu.degree)) {
    if (!edu.field_of_study?.trim())
      errors.field_of_study = "Field of study is required.";
    if (!edu.major?.trim())
      errors.major = "Major is required.";
  }
  if (MED_DEGREES.includes(edu.degree) && !edu.med_school?.trim())
    errors.med_school = "Medical school is required.";
  return errors;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TabEducation({
  isSetup,
  isDirty,
  education,
  setEducation,
  saveEducation,
}: TabEducationProps) {
  const [errors, setErrors] = useState<Record<number, EduErrors>>({});

  const handleSave = async () => {
    const newErrors: Record<number, EduErrors> = {};
    let hasError = false;
    education.forEach((edu, i) => {
      const e = validateEducation(edu);
      if (Object.keys(e).length > 0) {
        newErrors[i] = e;
        hasError = true;
      }
    });
    setErrors(newErrors);
    if (hasError) return;

    await saveEducation();
    setErrors({});
  };

  const clearError = (i: number, field: keyof EduErrors) => {
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
      <SectionHead numeral="I." kicker="Schooling" title="Education" />
      {education.length === 0 && (
        <div className="py-10 border-b border-[var(--kvis-border)] text-sm text-muted-foreground italic">
          No education added yet.
        </div>
      )}
      {education.map((edu, i) => (
        <div key={i} className="py-7 border-b border-[var(--kvis-border)]">
          {/* ── Entry header ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono tabular-nums font-semibold text-[var(--kvis-text3)] shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)] shrink-0">
                Education
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <PrivacyToggle
                value={edu.is_public ?? true}
                onChange={(v) =>
                  setEducation((prev) =>
                    prev.map((x, j) => (j === i ? { ...x, is_public: v } : x)),
                  )
                }
              />
              <button
                type="button"
                onClick={() =>
                  setEducation((prev) => prev.filter((_, j) => j !== i))
                }
                className="text-xs font-bold uppercase tracking-[0.22em] inline-flex items-center gap-1.5 hover:text-foreground transition-colors text-[var(--kvis-text3)]"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>

          {/* ── University ────────────────────────────────────────────────── */}
          <FieldRow label="University" required error={errors[i]?.uni_name}>
            <UniversityCombobox
              variant="underline"
              value={edu.uni_name}
              onChange={(v) => {
                clearError(i, "uni_name");
                setEducation((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, uni_name: v } : x)),
                );
              }}
              onCountryChange={(c) =>
                setEducation((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, country: c } : x)),
                )
              }
            />
          </FieldRow>

          {/* ── Degree ────────────────────────────────────────────────────── */}
          <FieldRow label="Degree" required error={errors[i]?.degree}>
            <Select
              value={edu.degree}
              onValueChange={(v) => {
                clearError(i, "degree");
                setEducation((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, degree: v } : x)),
                );
              }}
            >
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="Select degree" />
              </SelectTrigger>
              <SelectContent>
                {DEGREES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          {/* ── Medical track ─────────────────────────────────────────────── */}
          {MED_DEGREES.includes(edu.degree) && (
            <>
              <div className="mt-4 mb-2 py-2 border-b border-[var(--kvis-border)]">
                <p
                  className="text-xs font-bold uppercase tracking-[0.22em]"
                  style={{ color: "var(--kvis-purple)" }}
                >
                  Medical Track Details
                </p>
              </div>

              <FieldRow label="Medical school" required error={errors[i]?.med_school}>
                <Select
                  value={edu.med_school ?? ""}
                  onValueChange={(v) => {
                    clearError(i, "med_school");
                    setEducation((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, med_school: v } : x,
                      ),
                    );
                  }}
                >
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {MED_SCHOOLS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              {edu.med_school === "Other" && (
                <FieldRow label="Please specify">
                  <Input
                    placeholder="School name"
                    value={edu.uni_name}
                    onChange={(e) =>
                      setEducation((prev) =>
                        prev.map((x, j) =>
                          j === i ? { ...x, uni_name: e.target.value } : x,
                        ),
                      )
                    }
                    className={inputCls}
                  />
                </FieldRow>
              )}

              <FieldRow label="Dual degree">
                <label className="inline-flex items-center gap-2.5 text-sm text-foreground cursor-pointer pt-1.5">
                  <input
                    type="checkbox"
                    checked={edu.med_dual_degree ?? false}
                    onChange={(e) =>
                      setEducation((prev) =>
                        prev.map((x, j) =>
                          j === i
                            ? { ...x, med_dual_degree: e.target.checked }
                            : x,
                        ),
                      )
                    }
                    className="h-4 w-4 accent-foreground"
                  />
                  <span>In a dual / concurrent degree program</span>
                </label>
              </FieldRow>
              {edu.med_dual_degree && (
                <>
                  <FieldRow label="Dual degree type">
                    <Select
                      value={edu.med_dual_type ?? ""}
                      onValueChange={(v) =>
                        setEducation((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, med_dual_type: v } : x,
                          ),
                        )
                      }
                    >
                      <SelectTrigger className={selectTriggerCls}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {MED_DUAL_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  {edu.med_dual_type === "Other" && (
                    <FieldRow label="Please specify">
                      <Input
                        placeholder="Dual degree type"
                        value={edu.med_dual_field ?? ""}
                        onChange={(e) =>
                          setEducation((prev) =>
                            prev.map((x, j) =>
                              j === i
                                ? { ...x, med_dual_field: e.target.value }
                                : x,
                            ),
                          )
                        }
                        className={inputCls}
                      />
                    </FieldRow>
                  )}
                  {edu.med_dual_type && edu.med_dual_type !== "Other" && (
                    <FieldRow label="Second field">
                      <Input
                        placeholder="e.g. Biomedical Engineering"
                        value={edu.med_dual_field ?? ""}
                        onChange={(e) =>
                          setEducation((prev) =>
                            prev.map((x, j) =>
                              j === i
                                ? { ...x, med_dual_field: e.target.value }
                                : x,
                            ),
                          )
                        }
                        className={inputCls}
                      />
                    </FieldRow>
                  )}
                </>
              )}

              <FieldRow label="Hospital / site" hint="Clinical affiliation (optional).">
                <Input
                  placeholder="e.g. Siriraj Hospital"
                  value={edu.med_hospital ?? ""}
                  onChange={(e) =>
                    setEducation((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, med_hospital: e.target.value } : x,
                      ),
                    )
                  }
                  className={inputCls}
                />
              </FieldRow>

              <FieldRow label="Specialties" hint="Multi-select.">
                <TagPills
                  options={MED_SPECIALTIES}
                  selected={edu.med_specialties ?? []}
                  onChange={(v) =>
                    setEducation((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, med_specialties: v } : x,
                      ),
                    )
                  }
                />
                {(edu.med_specialties ?? []).includes("Other") && (
                  <Input
                    placeholder="Please specify"
                    className={`${inputCls} mt-2`}
                    value={edu.med_subspecialty ?? ""}
                    onChange={(e) =>
                      setEducation((prev) =>
                        prev.map((x, j) =>
                          j === i
                            ? { ...x, med_subspecialty: e.target.value }
                            : x,
                        ),
                      )
                    }
                  />
                )}
              </FieldRow>

              <FieldRow label="Sub-specialty" hint="Specific areas of interest (optional).">
                <Input
                  placeholder="e.g. Interventional Cardiology"
                  value={edu.med_subspecialty ?? ""}
                  onChange={(e) =>
                    setEducation((prev) =>
                      prev.map((x, j) =>
                        j === i
                          ? { ...x, med_subspecialty: e.target.value }
                          : x,
                      ),
                    )
                  }
                  className={inputCls}
                />
              </FieldRow>
            </>
          )}

          {/* ── Non-medical: Field of Study + Major ───────────────────────── */}
          {!MED_DEGREES.includes(edu.degree) && (
            <>
              <FieldRow label="Field of Study" required error={errors[i]?.field_of_study}>
                <Select
                  value={edu.field_of_study ?? ""}
                  onValueChange={(v) => {
                    clearError(i, "field_of_study");
                    setEducation((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, field_of_study: v } : x,
                      ),
                    );
                  }}
                >
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue placeholder="Select field of study" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELDS_OF_STUDY.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow label="Major (1)" required error={errors[i]?.major}>
                <MajorCombobox
                  variant="underline"
                  value={edu.major}
                  onChange={(v) => {
                    clearError(i, "major");
                    setEducation((prev) =>
                      prev.map((x, j) => (j === i ? { ...x, major: v } : x)),
                    );
                  }}
                />
              </FieldRow>
              <FieldRow label="Major (2)" hint="Optional.">
                <MajorCombobox
                  variant="underline"
                  value={edu.major2 ?? ""}
                  onChange={(v) =>
                    setEducation((prev) =>
                      prev.map((x, j) => (j === i ? { ...x, major2: v } : x)),
                    )
                  }
                />
              </FieldRow>
              <FieldRow label="Minor(s)" hint="Optional.">
                {(edu.minors ?? [""]).map((minor, mi) => (
                  <div key={mi} className="flex items-center gap-2 mb-2">
                    <MajorCombobox
                      variant="underline"
                      value={minor}
                      onChange={(v) =>
                        setEducation((prev) =>
                          prev.map((x, j) =>
                            j === i
                              ? {
                                  ...x,
                                  minors: (x.minors ?? [""]).map((m, k) =>
                                    k === mi ? v : m,
                                  ),
                                }
                              : x,
                          ),
                        )
                      }
                    />
                    {mi > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setEducation((prev) =>
                            prev.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    minors: (x.minors ?? []).filter(
                                      (_, k) => k !== mi,
                                    ),
                                  }
                                : x,
                            ),
                          )
                        }
                        className="text-[var(--kvis-text3)] hover:text-foreground transition-colors shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setEducation((prev) =>
                      prev.map((x, j) =>
                        j === i
                          ? { ...x, minors: [...(x.minors ?? []), ""] }
                          : x,
                      ),
                    )
                  }
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add minor
                </button>
              </FieldRow>
            </>
          )}

          {/* ── Location ─────────────────────────────────────────────────── */}
          <FieldRow label="Country">
            <CountrySelect
              variant="underline"
              value={edu.country}
              onChange={(v) =>
                setEducation((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, country: v, state: "", city: "" } : x,
                  ),
                )
              }
            />
          </FieldRow>
          {edu.country && !CITY_STATE_COUNTRIES.has(edu.country) && (
            <FieldRow label="Province / State">
              <ProvinceSelect
                variant="underline"
                country={edu.country}
                value={edu.state ?? ""}
                onChange={(v) =>
                  setEducation((prev) =>
                    prev.map((x, j) =>
                      j === i ? { ...x, state: v, city: "" } : x,
                    ),
                  )
                }
              />
            </FieldRow>
          )}
          {edu.country && !CITY_STATE_COUNTRIES.has(edu.country) && (
            <FieldRow label="City">
              <CitySelect
                variant="underline"
                country={edu.country}
                province={edu.state ?? ""}
                value={edu.city ?? ""}
                onChange={(v) =>
                  setEducation((prev) =>
                    prev.map((x, j) => (j === i ? { ...x, city: v } : x)),
                  )
                }
              />
            </FieldRow>
          )}

          {/* ── Years ────────────────────────────────────────────────────── */}
          <FieldRow label="Years">
            <div className="flex items-center gap-3">
              <Input
                type="number"
                placeholder="From"
                value={edu.start_year ?? ""}
                onChange={(e) =>
                  setEducation((prev) =>
                    prev.map((x, j) =>
                      j === i
                        ? {
                            ...x,
                            start_year: parseInt(e.target.value) || undefined,
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
                value={edu.end_year ?? ""}
                onChange={(e) =>
                  setEducation((prev) =>
                    prev.map((x, j) =>
                      j === i
                        ? {
                            ...x,
                            end_year: parseInt(e.target.value) || undefined,
                          }
                        : x,
                    ),
                  )
                }
                className={`${inputCls} w-20`}
              />
            </div>
          </FieldRow>

          {/* ── Is Current ───────────────────────────────────────────────── */}
          <FieldRow label="Currently here">
            <label className="inline-flex items-center gap-2.5 text-sm text-foreground cursor-pointer pt-1.5">
              <input
                type="checkbox"
                checked={edu.is_current ?? false}
                onChange={(e) =>
                  setEducation((prev) =>
                    prev.map((x, j) =>
                      j === i ? { ...x, is_current: e.target.checked } : x,
                    ),
                  )
                }
                className="h-4 w-4 accent-foreground"
              />
              <span>Currently studying here</span>
            </label>
          </FieldRow>

          {/* ── Scholarship ──────────────────────────────────────────────── */}
          <FieldRow label="Scholarships">
            <TagPills
              options={SCHOLARSHIP_NAMES}
              selected={edu.scholarship ?? []}
              onChange={(v) =>
                setEducation((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, scholarship: v } : x)),
                )
              }
            />
          </FieldRow>

          {(edu.scholarship?.length ?? 0) > 0 && (
            <>
              <FieldRow label="Funding type">
                <Select
                  value={edu.scholarship_type ?? ""}
                  onValueChange={(v) =>
                    setEducation((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, scholarship_type: v } : x,
                      ),
                    )
                  }
                >
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOLARSHIP_TYPES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="Bond status">
                <Select
                  value={edu.scholarship_bond ?? ""}
                  onValueChange={(v) =>
                    setEducation((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, scholarship_bond: v } : x,
                      ),
                    )
                  }
                >
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue placeholder="Select bond status" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOLARSHIP_BOND.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
            </>
          )}
        </div>
      ))}

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="pt-8 flex items-center gap-4 flex-wrap">
        {!isSetup && (
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
            className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="h-3.5 w-3.5" /> Save education
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setEducation((prev) => [
              ...prev,
              {
                uni_name: "",
                degree: "",
                major: "",
                country: "",
                scholarship: [],
                is_public: true,
              },
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