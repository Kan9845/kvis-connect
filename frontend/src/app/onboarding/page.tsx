"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/cache/keys";
import { Loader2, ArrowRight } from "lucide-react";
import { P, FieldLabel, editorialInputClass } from "@/app/auth/AuthShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UniversityCombobox } from "@/components/ui/university-combobox";
import { CountrySelect, CitySelect, CITY_STATE_COUNTRIES } from "@/components/ui/location-selects";
import { MajorCombobox } from "@/components/ui/major-combobox";
import { JOB_FIELDS } from "@/lib/constants/universities";

type Role = "student" | "alumni";

const GRADES = [
  { value: 10, label: "M.4" },
  { value: 11, label: "M.5" },
  { value: 12, label: "M.6" },
];
const ELEMENTALS = ["earth", "water", "air", "fire"] as const;
const DEGREES = [
  { value: "Bachelor", label: "Bachelor's" },
  { value: "Master", label: "Master's" },
  { value: "PhD", label: "PhD" },
  { value: "Other", label: "Other" },
];

const INPUT_BORDER = "oklch(35% 0.005 294)";
const INPUT_BORDER_FOCUS = "oklch(78% 0.01 294)";

function focusable(set: (v: string) => void) {
  return {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = INPUT_BORDER_FOCUS;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = INPUT_BORDER;
    },
  };
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  cols = 2,
}: {
  options: { value: T; label: string }[];
  value: T | null | "";
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className="h-12 border text-xs font-bold uppercase tracking-[0.18em] transition-colors"
          style={{
            borderColor: value === o.value ? P.purple : INPUT_BORDER,
            color: value === o.value ? P.purple : P.text3,
            background: value === o.value ? "oklch(95% 0.035 294)" : "transparent",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const { user, loading, refetch } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [role, setRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Student fields
  const [grade, setGrade] = useState<number | null>(null);
  const [elemental, setElemental] = useState<"earth" | "water" | "air" | "fire" | "">("");
  const [classNum, setClassNum] = useState<number | null>(null);

  // Alumni fields
  const [kvisYear, setKvisYear] = useState("");
  const [stillStudying, setStillStudying] = useState<boolean | null>(null);
  // Education
  const [uniName, setUniName] = useState("");
  const [degree, setDegree] = useState("");
  const [major, setMajor] = useState("");
  const [eduCountry, setEduCountry] = useState("");
  const [eduCity, setEduCity] = useState("");
  // Job
  const [jobTitle, setJobTitle] = useState("");
  const [jobField, setJobField] = useState("");
  const [employer, setEmployer] = useState("");
  const [jobCountry, setJobCountry] = useState("");
  const [jobCity, setJobCity] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (CITY_STATE_COUNTRIES.has(eduCountry)) setEduCity(eduCountry);
  }, [eduCountry]);

  useEffect(() => {
    if (CITY_STATE_COUNTRIES.has(jobCountry)) setJobCity(jobCountry);
  }, [jobCountry]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: P.text3 }} />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate before setting submitting so React doesn't batch the true+false updates
    if (role === "student") {
      if (!grade || !elemental || !classNum) {
        setError("Please fill in all fields.");
        return;
      }
    } else {
      if (!kvisYear || stillStudying === null) {
        setError("Please fill in all required fields.");
        return;
      }
      if (stillStudying && (!uniName || !degree || !major || !eduCountry || !eduCity)) {
        setError("Please fill in all education fields.");
        return;
      }
      if (!stillStudying && (!jobTitle || !jobField || !employer || !jobCountry || !jobCity)) {
        setError("Please fill in all job fields.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (role === "student") {
        await userApi.updateMe({
          current_grade: grade ?? undefined,
          current_elemental: elemental ?? undefined,
          current_class: classNum ?? undefined,
          profile_setup_done: true,
        });
      } else {
        const country = stillStudying ? eduCountry : jobCountry;
        const city = stillStudying ? eduCity : jobCity;
        await userApi.updateMe({
          kvis_year: parseInt(kvisYear),
          country,
          place: `${city}, ${country}`,
          profile_setup_done: true,
        });
        if (stillStudying) {
          await userApi.updateEducation([{ uni_name: uniName, degree, major, country: eduCountry, state: eduCity }]);
        } else {
          await userApi.updateCareer([{
            job_title: jobTitle,
            employer,
            job_field: jobField,
            country: jobCountry,
            state: jobCity,
            is_current: true,
          }]);
        }
      }
      await refetch();
      queryClient.invalidateQueries({ queryKey: keys.globe.pins() });
      router.replace("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const issueLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-6xl px-6 lg:px-12 py-10 lg:py-16">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-20">

          {/* Left column */}
          <section className="lg:pr-10 lg:border-r lg:sticky lg:top-16 lg:self-start" style={{ borderColor: P.rule }}>
            <div className="flex items-baseline gap-4 mb-5">
              <span className="font-mono font-black text-2xl tabular-nums" style={{ color: P.green, letterSpacing: "-0.02em" }}>03</span>
              <span className="text-[11px] uppercase tracking-[0.32em] font-bold" style={{ color: P.text3 }}>
                Setup · One time
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.035em] leading-[0.9] text-foreground max-w-[12ch]">
              Tell us about yourself.
            </h1>
            <p className="mt-6 text-base lg:text-[17px] text-muted-foreground max-w-[42ch] leading-relaxed">
              This helps us show the right data on the stats and alumni pages. It only takes a minute and you can update everything later.
            </p>
            <div
              className="mt-12 pt-6 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.3em]"
              style={{ borderColor: P.rule, color: P.text3 }}
            >
              <span>KVIS Connect</span>
              <span className="tabular-nums">{issueLabel}</span>
            </div>
          </section>

          {/* Right column */}
          <section>
            <div className="max-w-md">
              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Step 1: Role selection */}
                <div>
                  <FieldLabel>I am a…</FieldLabel>
                  <ToggleGroup
                    options={[
                      { value: "student" as Role, label: "Current Student" },
                      { value: "alumni" as Role, label: "Alumni" },
                    ]}
                    value={role}
                    onChange={setRole}
                    cols={2}
                  />
                </div>

                {/* Step 2a: Student fields */}
                {role === "student" && (
                  <div className="space-y-6">
                    <div>
                      <FieldLabel>Current grade</FieldLabel>
                      <ToggleGroup
                        options={GRADES.map((g) => ({ value: String(g.value), label: g.label }))}
                        value={grade ? String(grade) : null}
                        onChange={(v) => setGrade(Number(v))}
                        cols={3}
                      />
                    </div>

                    <div>
                      <FieldLabel>Elemental house</FieldLabel>
                      <ToggleGroup
                        options={ELEMENTALS.map((el) => ({ value: el, label: el }))}
                        value={elemental}
                        onChange={(v) => setElemental(v as typeof elemental)}
                        cols={4}
                      />
                    </div>

                    <div>
                      <FieldLabel>Class number</FieldLabel>
                      <ToggleGroup
                        options={[1, 2, 3, 4].map((c) => ({ value: String(c), label: String(c) }))}
                        value={classNum ? String(classNum) : null}
                        onChange={(v) => setClassNum(Number(v))}
                        cols={4}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2b: Alumni fields */}
                {role === "alumni" && (
                  <div className="space-y-6">
                    <div>
                      <FieldLabel>KVIS batch</FieldLabel>
                      <input
                        type="number"
                        placeholder="1"
                        value={kvisYear}
                        onChange={(e) => setKvisYear(e.target.value)}
                        required
                        className={editorialInputClass}
                        style={{ borderColor: INPUT_BORDER }}
                        {...focusable(setKvisYear)}
                      />
                    </div>

                    <div>
                      <FieldLabel>Still studying?</FieldLabel>
                      <ToggleGroup
                        options={[
                          { value: "yes", label: "Yes" },
                          { value: "no", label: "No" },
                        ]}
                        value={stillStudying === null ? null : stillStudying ? "yes" : "no"}
                        onChange={(v) => setStillStudying(v === "yes")}
                        cols={2}
                      />
                    </div>

                    {/* Education form */}
                    {stillStudying === true && (
                      <div className="space-y-6">
                        <div>
                          <FieldLabel>University / Institution</FieldLabel>
                          <UniversityCombobox
                            value={uniName}
                            onChange={setUniName}
                            onCountryChange={setEduCountry}
                            placeholder="VISTEC"
                            inputBorderColor={INPUT_BORDER}
                          />
                        </div>
                        <div>
                          <FieldLabel>Degree</FieldLabel>
                          <Select value={degree} onValueChange={setDegree}>
                            <SelectTrigger className="rounded-none h-12 text-[15px] focus:ring-0 focus:ring-offset-0 bg-transparent px-4 data-[placeholder]:text-foreground/25"
                            style={{ borderColor: INPUT_BORDER }}>
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                              {DEGREES.map((d) => (
                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <FieldLabel>Country</FieldLabel>
                          <CountrySelect
                            value={eduCountry}
                            onChange={(v) => { setEduCountry(v); setEduCity(CITY_STATE_COUNTRIES.has(v) ? v : ""); }}
                            borderColor={INPUT_BORDER}
                          />
                        </div>
                        {!CITY_STATE_COUNTRIES.has(eduCountry) && (
                          <div>
                            <FieldLabel>City / Province</FieldLabel>
                            <CitySelect
                              country={eduCountry}
                              value={eduCity}
                              onChange={setEduCity}
                              borderColor={INPUT_BORDER}
                            />
                          </div>
                        )}
                        <div>
                          <FieldLabel>Major / Field of study</FieldLabel>
                          <MajorCombobox
                            value={major}
                            onChange={setMajor}
                            borderColor={INPUT_BORDER}
                          />
                        </div>
                      </div>
                    )}

                    {/* Job form */}
                    {stillStudying === false && (
                      <div className="space-y-6">
                        <div>
                          <FieldLabel>Job title</FieldLabel>
                          <input
                            type="text"
                            placeholder="Software Engineer"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            className={editorialInputClass}
                            style={{ borderColor: INPUT_BORDER }}
                            {...focusable(setJobTitle)}
                          />
                        </div>
                        <div>
                          <FieldLabel>Field</FieldLabel>
                          <Select value={jobField} onValueChange={setJobField}>
                            <SelectTrigger className="rounded-none h-12 text-[15px] focus:ring-0 focus:ring-offset-0 bg-transparent px-4 data-[placeholder]:text-foreground/25"
                            style={{ borderColor: INPUT_BORDER }}>
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                              {JOB_FIELDS.map((f) => (
                                <SelectItem key={f} value={f}>{f}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <FieldLabel>Employer / Company</FieldLabel>
                          <input
                            type="text"
                            placeholder="Google"
                            value={employer}
                            onChange={(e) => setEmployer(e.target.value)}
                            className={editorialInputClass}
                            style={{ borderColor: INPUT_BORDER }}
                            {...focusable(setEmployer)}
                          />
                        </div>
                        <div>
                          <FieldLabel>Country</FieldLabel>
                          <CountrySelect
                            value={jobCountry}
                            onChange={(v) => { setJobCountry(v); setJobCity(CITY_STATE_COUNTRIES.has(v) ? v : ""); }}
                            borderColor={INPUT_BORDER}
                          />
                        </div>
                        {!CITY_STATE_COUNTRIES.has(jobCountry) && (
                          <div>
                            <FieldLabel>City / Province</FieldLabel>
                            <CitySelect
                              country={jobCountry}
                              value={jobCity}
                              onChange={setJobCity}
                              borderColor={INPUT_BORDER}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <p
                    className="text-xs font-medium uppercase tracking-[0.18em] py-2 px-3"
                    style={{
                      color: "oklch(70% 0.18 25)",
                      background: "oklch(20% 0.04 25)",
                      border: "1px solid oklch(40% 0.12 25)",
                    }}
                  >
                    {error}
                  </p>
                )}

                {role && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-none bg-foreground text-background hover:bg-foreground/90 transition-colors text-xs uppercase tracking-[0.28em] font-bold disabled:opacity-50"
                  >
                    Continue
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                )}
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
