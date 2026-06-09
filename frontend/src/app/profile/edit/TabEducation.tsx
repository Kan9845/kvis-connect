"use client";
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

interface TabEducationProps {
  isSetup: boolean;
  education: Omit<Education, "id">[];
  setEducation: React.Dispatch<React.SetStateAction<Omit<Education, "id">[]>>;
  saveEducation: () => Promise<void>;
}

export function TabEducation({
  isSetup,
  education,
  setEducation,
  saveEducation,
}: TabEducationProps) {
  return (
    <section>
      <SectionHead numeral="I." kicker="Schooling" title="Education" />
      {education.length === 0 && (
        <div className="py-10 border-b border-[var(--kvis-border)] text-sm text-muted-foreground italic">
          No education added yet.
        </div>
      )}
      {education.map((edu, i) => (
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
                Education
              </span>
            </div>
            <div className="flex items-center gap-4">
              <PrivacyToggle
                value={edu.is_public ?? true}
                onChange={(v) =>
                  setEducation((prev) =>
                    prev.map((x, j) =>
                      j === i ? { ...x, is_public: v } : x,
                    ),
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
          <FieldRow label="University">
            <UniversityCombobox
              variant="underline"
              value={edu.uni_name}
              onChange={(v) =>
                setEducation((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, uni_name: v } : x,
                  ),
                )
              }
              onCountryChange={(c) =>
                setEducation((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, country: c } : x,
                  ),
                )
              }
            />
          </FieldRow>
          <FieldRow label="Degree">
            <Select
              value={edu.degree}
              onValueChange={(v) =>
                setEducation((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, degree: v } : x)),
                )
              }
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
          {/* Medical track - shown when degree is MD/MBBS */}
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

              <FieldRow label="Medical school">
                <Select
                  value={edu.med_school ?? ""}
                  onValueChange={(v) =>
                    setEducation((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, med_school: v } : x,
                      ),
                    )
                  }
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
                          j === i
                            ? { ...x, uni_name: e.target.value }
                            : x,
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

              <FieldRow
                label="Hospital / site"
                hint="Clinical affiliation (optional)."
              >
                <Input
                  placeholder="e.g. Siriraj Hospital"
                  value={edu.med_hospital ?? ""}
                  onChange={(e) =>
                    setEducation((prev) =>
                      prev.map((x, j) =>
                        j === i
                          ? { ...x, med_hospital: e.target.value }
                          : x,
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

              <FieldRow
                label="Sub-specialty"
                hint="Specific areas of interest (optional)."
              >
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
          {!MED_DEGREES.includes(edu.degree) && (
            <>
              <FieldRow label="Major (1)" required>
                <MajorCombobox
                  variant="underline"
                  value={edu.major}
                  onChange={(v) =>
                    setEducation((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, major: v } : x,
                      ),
                    )
                  }
                />
              </FieldRow>
              <FieldRow label="Major (2)" hint="Optional.">
                <Input
                  placeholder="Second major"
                  value={edu.major2 ?? ""}
                  onChange={(e) =>
                    setEducation((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, major2: e.target.value } : x,
                      ),
                    )
                  }
                  className={inputCls}
                />
              </FieldRow>
              <FieldRow label="Minors" hint="Optional, comma-separated.">
                <Input
                  placeholder="e.g. Statistics, Philosophy"
                  value={edu.minor1 ?? ""}
                  onChange={(e) =>
                    setEducation((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, minor1: e.target.value } : x,
                      ),
                    )
                  }
                  className={inputCls}
                />
              </FieldRow>
            </>
          )}
          <FieldRow label="Country">
            <CountrySelect
              variant="underline"
              value={edu.country}
              onChange={(v) =>
                setEducation((prev) =>
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
          {!CITY_STATE_COUNTRIES.has(edu.country) && (
            <FieldRow label="City">
              <CitySelect
                variant="underline"
                country={edu.country}
                value={edu.state ?? ""}
                onChange={(v) =>
                  setEducation((prev) =>
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
                value={edu.start_year ?? ""}
                onChange={(e) =>
                  setEducation((prev) =>
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
                value={edu.end_year ?? ""}
                onChange={(e) =>
                  setEducation((prev) =>
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
                className={`${inputCls} w-20`}
              />
            </div>
          </FieldRow>
          {/* Scholarship */}
          <FieldRow label="Scholarship">
            <Select
              value={edu.scholarship ?? ""}
              onValueChange={(v) =>
                setEducation((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, scholarship: v } : x,
                  ),
                )
              }
            >
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="Select scholarship" />
              </SelectTrigger>
              <SelectContent>
                {SCHOLARSHIP_NAMES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          {edu.scholarship && (
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
      <div className="pt-8 flex items-center gap-4 flex-wrap">
        {!isSetup && (
          <Button
            type="button"
            onClick={saveEducation}
            className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2"
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
