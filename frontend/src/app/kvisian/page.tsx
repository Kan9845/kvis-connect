"use client";
import { Suspense, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { keys } from "@/lib/cache/keys";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, X, ChevronDown } from "lucide-react";
import type { UserCard } from "@/lib/types";
import { PageEntrance, FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";
import { cohortColor, cohortTextColor, cohortColorHex, cohortColorSoftHex, effectiveKvisYear, genLabel } from "@/lib/utils";

type PersonType = "all" | "alumni" | "students";
type Element = "earth" | "water" | "air" | "fire";

const COHORT_YEARS = [9, 8, 7, 6, 5, 4, 3, 2, 1];
const GRADES = [12, 11, 10];
const CLASSES = [1, 2, 3, 4];
const ELEMENTS: Element[] = ["earth", "water", "air", "fire"];
const ELEMENT_LABEL: Record<Element, string> = { earth: "Earth", water: "Water", air: "Air", fire: "Fire" };

function gradeLabel(g: number) { return `M.${g - 6}`; }
function cohortGradYear(k: number) { return 2017 + k; }
function initials(u: UserCard) { return `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase(); }

function captionAlumni(u: UserCard): string {
  const currentEdu = u.education?.find((e) => !e.end_year) ?? u.education?.[0];
  const job = u.career?.find((c) => c.is_current) ?? u.career?.[0];
  if (job?.job_title) return [job.job_title, (job.employer || job.job_field) && `@ ${job.employer || job.job_field}`].filter(Boolean).join(" ");
  if (currentEdu) return [currentEdu.major || currentEdu.degree, currentEdu.uni_name].filter(Boolean).join(" · ");
  return "Profile pending";
}

function captionStudent(u: UserCard): string {
  const parts: string[] = [];
  if (u.current_grade) parts.push(gradeLabel(u.current_grade));
  if (u.current_class) parts.push(`Class ${u.current_class}`);
  if (u.current_elemental) parts.push(ELEMENT_LABEL[u.current_elemental]);
  return parts.join(" · ") || "Enrolled student";
}

function Portrait({ u, isAlumni }: { u: UserCard; isAlumni: boolean }) {
  const name = `${u.first_name} ${u.last_name}`;
  const ky = effectiveKvisYear(u);
  const color = cohortColor(ky);
  const colorHex = cohortColorHex(ky);
  const colorSoftHex = cohortColorSoftHex(ky);
  const caption = isAlumni ? captionAlumni(u) : captionStudent(u);
  const badge = isAlumni
    ? (u.kvis_year ? genLabel(u.kvis_year) : null)
    : (u.current_grade ? gradeLabel(u.current_grade) : null);

  return (
    <Link href={`/profile/${u.slug ?? u.id}`} className="group block h-full">
      <div
        className="relative flex flex-col h-full overflow-hidden rounded-2xl border border-[var(--kvis-rule)] transition-all duration-300 group-hover:border-transparent group-hover:shadow-lg"
        style={{ background: "var(--kvis-bg)" }}
      >
        {/* Top color strip */}
        <div
          className="h-1.5 w-full flex-shrink-0"
          style={{ background: `linear-gradient(90deg, ${colorHex}, ${colorSoftHex})` }}
        />

        <div className="flex flex-col items-center gap-3 p-4 flex-1">
          {/* Avatar */}
          <div
            className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 mt-1"
            style={{ outline: `2.5px solid ${color}`, outlineOffset: "2px" }}
          >
            {u.profile_pic_url ? (
              <Image
                src={u.profile_pic_url}
                alt={name}
                fill
                sizes="64px"
                className="object-cover grayscale-[18%] group-hover:grayscale-0 transition-all duration-500"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center font-black text-lg tracking-tight"
                style={{
                  background: `linear-gradient(135deg, ${colorHex} 0%, ${colorSoftHex} 100%)`,
                  color: cohortTextColor(ky),
                }}
              >
                {initials(u)}
              </div>
            )}
          </div>

          {/* Name + badge */}
          <div className="text-center min-w-0 w-full">
            <p
              className="text-sm font-bold text-foreground leading-tight truncate group-hover:underline decoration-2 underline-offset-[3px]"
              style={{ textDecorationColor: color }}
            >
              {u.first_name} {u.last_name}
            </p>
            {badge && (
              <span
                className="inline-block mt-1 text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full"
                style={{ background: `${colorHex}22`, color }}
              >
                {badge}
              </span>
            )}
          </div>

          {/* Caption */}
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug text-center w-full flex-1">
            {caption}
          </p>

          {/* Footer — location */}
          {u.country && (
            <div
              className="w-full pt-2 mt-auto border-t text-[10px] font-semibold uppercase tracking-[0.14em] text-center"
              style={{ borderColor: "var(--kvis-rule)", color: "var(--kvis-text3)" }}
            >
              {u.country}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({ display, meta, count, unitLabel, kvis_year }: {
  display: string; meta: string; count: number; unitLabel: string; kvis_year?: number;
}) {
  const color = cohortColor(kvis_year);
  return (
    <header className="flex items-end justify-between gap-6 pb-5 border-b border-[var(--kvis-rule)] mb-7">
      <div className="flex items-baseline gap-5">
        <h2 className="font-display text-6xl md:text-7xl font-black tracking-[-0.04em] leading-[0.85] text-foreground tabular-nums">{display}</h2>
        <p className="text-xs font-bold uppercase tracking-[0.26em]" style={{ color }}>{meta}</p>
      </div>
      <p className="text-xs uppercase tracking-[0.22em] tabular-nums text-[var(--kvis-text3)]">{count} {unitLabel}</p>
    </header>
  );
}

function CohortSection({ k, students }: { k: number; students: UserCard[] }) {
  if (!students.length) return null;
  return (
    <FadeUp>
      <section className="pt-14">
        <SectionHeader display={`KVIS ${k}`} meta={`Class of ${cohortGradYear(k)}`} count={students.length} unitLabel="alumni" kvis_year={k} />
        <StaggerList>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 items-stretch">
            {students.map((s) => (
              <StaggerItem key={s.id} className="h-full">
                <Portrait u={s} isAlumni />
              </StaggerItem>
            ))}
          </div>
        </StaggerList>
      </section>
    </FadeUp>
  );
}

function GradeSection({ g, students }: { g: number; students: UserCard[] }) {
  if (!students.length) return null;
  const pseudoYear = effectiveKvisYear({ current_grade: g });
  const sorted = [...students].sort((a, b) => {
    const ca = a.current_class ?? 99, cb = b.current_class ?? 99;
    if (ca !== cb) return ca - cb;
    return (a.first_name || "").localeCompare(b.first_name || "");
  });
  return (
    <FadeUp>
      <section className="pt-14">
        <SectionHeader display={gradeLabel(g)} meta={`Grade ${g}`} count={students.length} unitLabel="in class" kvis_year={pseudoYear ?? undefined} />
        <StaggerList>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 items-stretch">
            {sorted.map((s) => (
              <StaggerItem key={s.id} className="h-full">
                <Portrait u={s} isAlumni={false} />
              </StaggerItem>
            ))}
          </div>
        </StaggerList>
      </section>
    </FadeUp>
  );
}

function DropFilter({ label, active, options, value, onChange }: {
  label: string;
  active: boolean;
  options: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label ?? label;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] border transition-colors rounded-sm"
        style={{
          borderColor: active ? "var(--kvis-purple)" : "var(--kvis-rule)",
          color: active ? "var(--kvis-purple)" : "var(--kvis-text3)",
          background: active ? "var(--kvis-purple-soft)" : "transparent",
        }}
      >
        {active ? selectedLabel : label}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-50 bg-background border border-[var(--kvis-rule)] shadow-lg min-w-[160px] max-h-64 overflow-y-auto"
          onMouseLeave={() => setOpen(false)}
        >
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-[var(--kvis-purple-soft)] transition-colors flex items-center justify-between gap-4"
              style={{ color: value === o.value ? "var(--kvis-purple)" : "var(--kvis-text3)" }}
            >
              {o.label}
              {o.count !== undefined && <span className="font-mono text-[10px] opacity-60">{o.count}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return <Suspense fallback={null}><SearchPageInner /></Suspense>;
}

function SearchPageInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login?next=/kvisian");
    if (!authLoading && user && !user.profile_setup_done) router.replace("/onboarding");
  }, [authLoading, user, router]);

  const [personType, setPersonType] = useState<PersonType>("all");
  const [activeCohort, setActiveCohort] = useState("");
  const [activeCountry, setActiveCountry] = useState("");
  const [activeField, setActiveField] = useState("");
  const [activeUni, setActiveUni] = useState("");
  const [activeGrade, setActiveGrade] = useState("");
  const [activeClass, setActiveClass] = useState("");
  const [activeElement, setActiveElement] = useState("");
  const [q, setQ] = useState("");

  const { data: rawPeople = [], isLoading } = useQuery({
    queryKey: keys.yearbook.all(),
    queryFn: () => api.get<UserCard[]>("/api/search", { params: { sort: "kvis_year", order: "asc", limit: 1000 } }).then((r) => r.data),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const alumni = useMemo(() => rawPeople.filter(p => !p.current_grade), [rawPeople]);
  const students = useMemo(() => rawPeople.filter(p => !!p.current_grade), [rawPeople]);

  const sourceList = useMemo(() => {
    if (personType === "alumni") return alumni;
    if (personType === "students") return students;
    return rawPeople;
  }, [personType, alumni, students, rawPeople]);

  const countries = useMemo(() => {
    const m = new Map<string, number>();
    alumni.forEach(a => { if (a.country) m.set(a.country, (m.get(a.country) ?? 0) + 1); });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20);
  }, [alumni]);

  const fields = useMemo(() => {
    const m = new Map<string, number>();
    alumni.forEach(a => {
      const f = a.career?.[0]?.job_field || a.education?.[0]?.major;
      if (f) m.set(f, (m.get(f) ?? 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20);
  }, [alumni]);

  const unis = useMemo(() => {
    const m = new Map<string, number>();
    alumni.forEach(a => {
      const u = a.education?.[0]?.uni_name;
      if (u) m.set(u, (m.get(u) ?? 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20);
  }, [alumni]);

  const classCounts = useMemo(() => {
    const m = new Map<number, number>();
    students.forEach(s => { if (s.current_class) m.set(s.current_class, (m.get(s.current_class) ?? 0) + 1); });
    return m;
  }, [students]);

  const elementCounts = useMemo(() => {
    const m = new Map<string, number>();
    students.forEach(s => { if (s.current_elemental) m.set(s.current_elemental, (m.get(s.current_elemental) ?? 0) + 1); });
    return m;
  }, [students]);

  const filtered = useMemo(() => {
    const qLow = q.trim().toLowerCase();
    return sourceList.filter(u => {
      if (activeCohort && String(u.kvis_year) !== activeCohort) return false;
      if (activeCountry && u.country !== activeCountry) return false;
      if (activeGrade && String(u.current_grade) !== activeGrade) return false;
      if (activeClass && String(u.current_class) !== activeClass) return false;
      if (activeElement && u.current_elemental !== activeElement) return false;
      if (activeField) {
        const hasField = u.career?.some(c => c.job_field === activeField) || u.education?.some(e => e.major === activeField);
        if (!hasField) return false;
      }
      if (activeUni) {
        const hasUni = u.education?.some(e => e.uni_name === activeUni);
        if (!hasUni) return false;
      }
      if (qLow) {
        const hay = [
          `${u.first_name} ${u.last_name}`,
          u.country,
          u.interests,
          u.career?.[0]?.job_title,
          u.career?.[0]?.employer,
          u.career?.[0]?.job_field,
          u.education?.[0]?.major,
          u.education?.[0]?.uni_name,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(qLow)) return false;
      }
      return true;
    });
  }, [sourceList, activeCohort, activeCountry, activeGrade, activeClass, activeElement, activeField, activeUni, q]);

  const byCohort = useMemo(() => {
    const m = new Map<number, UserCard[]>();
    filtered.filter(u => !u.current_grade).forEach(a => {
      const k = a.kvis_year ?? 0;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(a);
    });
    m.forEach(arr => arr.sort((x, y) => (x.first_name || "").localeCompare(y.first_name || "")));
    return m;
  }, [filtered]);

  const byGrade = useMemo(() => {
    const m = new Map<number, UserCard[]>();
    filtered.filter(u => !!u.current_grade).forEach(s => {
      const g = s.current_grade ?? 0;
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(s);
    });
    return m;
  }, [filtered]);

  const hasFilter = !!activeCohort || !!activeCountry || !!activeGrade || !!activeClass || !!activeElement || !!activeField || !!activeUni || q.trim().length > 0 || personType !== "all";

  const resetFilters = () => {
    setPersonType("all"); setActiveCohort(""); setActiveCountry("");
    setActiveGrade(""); setActiveClass(""); setActiveElement("");
    setActiveField(""); setActiveUni(""); setQ("");
  };

  const showAlumni = personType === "all" || personType === "alumni";
  const showStudents = personType === "all" || personType === "students";

  if (authLoading || !user) {
    return (
      <PageEntrance>
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-10 lg:py-14">
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[var(--kvis-rule)] overflow-hidden">
                <Skeleton className="h-1.5 w-full" />
                <div className="p-4 flex flex-col items-center gap-3">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageEntrance>
    );
  }

  return (
    <PageEntrance>
      <div className="min-h-full bg-background">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-10 lg:py-14">

          <FadeUp>
            <header className="pb-7 border-b border-foreground/60">
              <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 text-[var(--kvis-purple)]">KVIS Connect · Directory</p>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95] text-foreground">
                Find your people.
              </h1>
              <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                Browse {rawPeople.length} Kvisians by cohort, country, field, and interests.
              </p>
              <div className="flex items-center gap-3 md:gap-4 mt-6 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap text-[var(--kvis-text3)]">
                <span>{alumni.length} alumni</span>
                <span aria-hidden>·</span>
                <span>{students.length} students</span>
                <span aria-hidden>·</span>
                <span>{countries.length} countries</span>
              </div>
            </header>
          </FadeUp>

          <FadeUp delay={0.1}>
            <nav className="py-4 border-b border-[var(--kvis-rule)] space-y-3">
              <div className="flex items-center gap-3 px-3 py-2 border border-[var(--kvis-rule)] rounded-sm">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search by name, interest (chess, photography...), field, university..."
                  className="flex-1 bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
                {q && <button onClick={() => setQ("")}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
              </div>

              <div className="flex items-center flex-wrap gap-2">
                {(["all", "alumni", "students"] as PersonType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setPersonType(t); setActiveCohort(""); setActiveGrade(""); setActiveClass(""); setActiveElement(""); setActiveField(""); setActiveUni(""); }}
                    className="px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] border transition-colors rounded-sm"
                    style={{
                      borderColor: personType === t ? "var(--kvis-purple)" : "var(--kvis-rule)",
                      color: personType === t ? "var(--kvis-purple)" : "var(--kvis-text3)",
                      background: personType === t ? "var(--kvis-purple-soft)" : "transparent",
                    }}
                  >
                    {t === "all" ? "Everyone" : t === "alumni" ? "Alumni" : "Students"}
                  </button>
                ))}

                <div className="w-px h-4 bg-[var(--kvis-rule)]" />

                <DropFilter
                  label="Anywhere"
                  active={!!activeCountry}
                  value={activeCountry}
                  onChange={setActiveCountry}
                  options={[{ value: "", label: "Anywhere" }, ...countries.map(([c, n]) => ({ value: c, label: c, count: n }))]}
                />

                {(personType === "all" || personType === "alumni") && (
                  <>
                    <DropFilter
                      label="Any cohort"
                      active={!!activeCohort}
                      value={activeCohort}
                      onChange={setActiveCohort}
                      options={[{ value: "", label: "Any cohort" }, ...COHORT_YEARS.map(y => ({ value: String(y), label: `K${y}` }))]}
                    />
                    <DropFilter
                      label="Any field"
                      active={!!activeField}
                      value={activeField}
                      onChange={setActiveField}
                      options={[{ value: "", label: "Any field" }, ...fields.map(([f, n]) => ({ value: f, label: f, count: n }))]}
                    />
                    <DropFilter
                      label="Any university"
                      active={!!activeUni}
                      value={activeUni}
                      onChange={setActiveUni}
                      options={[{ value: "", label: "Any university" }, ...unis.map(([u, n]) => ({ value: u, label: u, count: n }))]}
                    />
                  </>
                )}

                {(personType === "all" || personType === "students") && (
                  <>
                    <DropFilter
                      label="Any grade"
                      active={!!activeGrade}
                      value={activeGrade}
                      onChange={setActiveGrade}
                      options={[{ value: "", label: "Any grade" }, ...GRADES.map(g => ({ value: String(g), label: gradeLabel(g) }))]}
                    />
                    <DropFilter
                      label="Any element"
                      active={!!activeElement}
                      value={activeElement}
                      onChange={setActiveElement}
                      options={[{ value: "", label: "Any element" }, ...ELEMENTS.map(e => ({ value: e, label: ELEMENT_LABEL[e], count: elementCounts.get(e) ?? 0 }))]}
                    />
                    <DropFilter
                      label="Any class"
                      active={!!activeClass}
                      value={activeClass}
                      onChange={setActiveClass}
                      options={[{ value: "", label: "Any class" }, ...CLASSES.map(c => ({ value: String(c), label: `Class ${c}`, count: classCounts.get(c) ?? 0 }))]}
                    />
                  </>
                )}

                {hasFilter && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--kvis-text3)] hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>
            </nav>
          </FadeUp>

          {isLoading && (
            <div className="pt-10 space-y-10">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-16 w-full mb-6" />
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <div key={j} className="rounded-2xl border border-[var(--kvis-rule)] overflow-hidden">
                        <Skeleton className="h-1.5 w-full" />
                        <div className="p-4 flex flex-col items-center gap-3">
                          <Skeleton className="w-16 h-16 rounded-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <FadeUp>
              <div className="py-24 text-center">
                <p className="text-xs uppercase tracking-[0.28em] font-bold mb-4 text-[var(--kvis-text3)]">Nothing matches</p>
                <p className="text-3xl font-black tracking-tight text-foreground mb-3">No one found</p>
                {hasFilter && (
                  <Button variant="link" onClick={resetFilters} className="h-auto p-0 text-sm underline hover:no-underline text-[var(--kvis-purple)]">
                    Clear filters
                  </Button>
                )}
              </div>
            </FadeUp>
          )}

          {!isLoading && filtered.length > 0 && (
            <>
              {showAlumni && COHORT_YEARS.map(k => {
                const arr = byCohort.get(k) ?? [];
                return arr.length > 0 ? <CohortSection key={k} k={k} students={arr} /> : null;
              })}
              {showStudents && GRADES.map(g => {
                const arr = byGrade.get(g) ?? [];
                return arr.length > 0 ? <GradeSection key={g} g={g} students={arr} /> : null;
              })}
            </>
          )}

          {!isLoading && filtered.length > 0 && (
            <FadeUp>
              <footer className="mt-20 pt-6 border-t border-foreground/60 text-muted-foreground text-xs uppercase tracking-[0.22em] flex items-center justify-between">
                <span>- end -</span>
                <span className="tabular-nums">{filtered.length} people{hasFilter && ` (of ${rawPeople.length})`}</span>
              </footer>
            </FadeUp>
          )}

        </div>
      </div>
    </PageEntrance>
  );
}