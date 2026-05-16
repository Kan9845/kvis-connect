"use client";
import { Suspense, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X } from "lucide-react";
import { MOCK_CURRENT_STUDENTS } from "@/lib/mock-students";
import type { UserCard } from "@/lib/types";

const P = {
  purple: "oklch(44% 0.26 294)",
  purpleSoft: "oklch(95% 0.035 294)",
  green: "oklch(40% 0.16 148)",
  text3: "oklch(62% 0.005 294)",
  rule: "oklch(90% 0.007 294)",
};

type Tab = "alumni" | "students";

const COHORT_YEARS = [9, 8, 7, 6, 5, 4, 3, 2, 1];

// KVIS uses Thai M.4-M.6 (grade 10-12). Seniors first.
const GRADES = [12, 11, 10];
// KVIS has exactly 4 numerical classes per grade.
const CLASSES = [1, 2, 3, 4];
// Elemental houses. Roughly 18 per house.
type Element = "earth" | "water" | "air" | "fire";
const ELEMENTS: Element[] = ["earth", "water", "air", "fire"];
const ELEMENT_LABEL: Record<Element, string> = {
  earth: "Earth",
  water: "Water",
  air: "Air",
  fire: "Fire",
};

function cohortGradYear(k: number) {
  // K1 graduated 2016, K9 graduated 2024
  return 2015 + k;
}

function gradeLabel(g: number) {
  // 10 -> M.4, 11 -> M.5, 12 -> M.6
  return `M.${g - 6}`;
}

function initials(u: UserCard) {
  return `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase();
}

function captionAlumni(u: UserCard): string {
  const job = u.career?.find((c) => c.is_current) ?? u.career?.[0];
  if (job?.job_title) {
    const where = job.employer || job.job_field;
    return [job.job_title, where && `@ ${where}`].filter(Boolean).join(" ");
  }
  const edu = u.education?.[0];
  if (edu) {
    return [edu.major || edu.degree, edu.uni_name].filter(Boolean).join(" · ");
  }
  return "Profile pending";
}

function captionStudent(u: UserCard): string {
  const parts: string[] = [];
  if (u.current_grade) parts.push(gradeLabel(u.current_grade));
  if (u.current_class) parts.push(`Class ${u.current_class}`);
  if (u.current_elemental) parts.push(ELEMENT_LABEL[u.current_elemental]);
  if (parts.length === 0) return "Enrolled student";
  return parts.join(" · ");
}

function Portrait({ u, caption }: { u: UserCard; caption: string }) {
  const name = `${u.first_name} ${u.last_name}`;
  return (
    <Link href={`/profile/${u.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {u.profile_pic_url ? (
          <Image
            src={u.profile_pic_url}
            alt={name}
            fill
            sizes="(min-width:1280px) 160px, (min-width:1024px) 150px, (min-width:640px) 140px, 30vw"
            className="object-cover grayscale-[18%] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-white font-black text-3xl tracking-tight"
            style={{ background: P.purple }}
          >
            {initials(u)}
          </div>
        )}
        {u.country && (
          <span
            className="absolute bottom-1.5 right-1.5 text-[9px] font-bold uppercase tracking-[0.18em] px-1.5 py-0.5 bg-background/90 text-foreground"
          >
            {u.country.slice(0, 3)}
          </span>
        )}
      </div>
      <p
        className="pt-2 text-sm font-semibold text-foreground leading-tight group-hover:underline decoration-2 underline-offset-[3px]"
        style={{ textDecorationColor: P.purple }}
      >
        {u.first_name} {u.last_name}
      </p>
      <p className="text-xs text-muted-foreground line-clamp-2 leading-snug mt-0.5">
        {caption}
      </p>
    </Link>
  );
}

function GridShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-5 gap-y-7">
      {children}
    </div>
  );
}

function SectionHeader({
  display,
  meta,
  count,
  unitLabel,
}: {
  display: string;
  meta: string;
  count: number;
  unitLabel: string;
}) {
  return (
    <header
      className="flex items-end justify-between gap-6 pb-5 border-b mb-7"
      style={{ borderColor: P.rule }}
    >
      <div className="flex items-baseline gap-5">
        <h2 className="text-6xl md:text-7xl font-black tracking-[-0.04em] leading-[0.85] text-foreground tabular-nums">
          {display}
        </h2>
        <p
          className="text-xs font-bold uppercase tracking-[0.26em]"
          style={{ color: P.purple }}
        >
          {meta}
        </p>
      </div>
      <p
        className="text-xs uppercase tracking-[0.22em] tabular-nums"
        style={{ color: P.text3 }}
      >
        {count} {unitLabel}
      </p>
    </header>
  );
}

function CohortSection({ k, students }: { k: number; students: UserCard[] }) {
  if (students.length === 0) return null;
  return (
    <section className="pt-14">
      <SectionHeader
        display={`KVIS ${k}`}
        meta={`Class of ${cohortGradYear(k)}`}
        count={students.length}
        unitLabel="alumni"
      />
      <GridShell>
        {students.map((s) => (
          <Portrait key={s.id} u={s} caption={captionAlumni(s)} />
        ))}
      </GridShell>
    </section>
  );
}

function GradeSection({ g, students }: { g: number; students: UserCard[] }) {
  if (students.length === 0) return null;
  // Sort by class then by first name
  const sorted = [...students].sort((a, b) => {
    const ca = a.current_class ?? 99;
    const cb = b.current_class ?? 99;
    if (ca !== cb) return ca - cb;
    return (a.first_name || "").localeCompare(b.first_name || "");
  });
  return (
    <section className="pt-14">
      <SectionHeader
        display={gradeLabel(g)}
        meta={`Grade ${g}`}
        count={students.length}
        unitLabel="in class"
      />
      <GridShell>
        {sorted.map((s) => (
          <Portrait key={s.id} u={s} caption={captionStudent(s)} />
        ))}
      </GridShell>
    </section>
  );
}

function FilterButton({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-semibold uppercase tracking-[0.14em] transition-colors leading-none"
      style={{
        color: active ? P.purple : undefined,
        textDecoration: active ? "underline" : "none",
        textDecorationThickness: 2,
        textUnderlineOffset: 6,
      }}
    >
      <span
        className={active ? "" : "text-muted-foreground hover:text-foreground transition-colors"}
        style={active ? { color: P.purple } : undefined}
      >
        {children}
      </span>
      {count !== undefined && (
        <sup
          className="ml-1 text-xs font-mono tabular-nums"
          style={{ color: P.text3 }}
        >
          {count}
        </sup>
      )}
    </button>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid grid-cols-[72px_1fr] md:grid-cols-[100px_1fr] items-baseline gap-x-5 gap-y-2 py-3.5 border-t first:border-t-0"
      style={{ borderColor: P.rule }}
    >
      <span
        className="text-xs uppercase tracking-[0.26em] font-bold"
        style={{ color: P.text3 }}
      >
        {label}
      </span>
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2.5">
        {children}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-bold uppercase tracking-[0.28em] py-1 transition-colors"
      style={{
        color: active ? P.purple : undefined,
        textDecoration: active ? "underline" : "none",
        textDecorationThickness: 2,
        textUnderlineOffset: 8,
      }}
    >
      <span
        className={active ? "" : "text-muted-foreground hover:text-foreground transition-colors"}
        style={active ? { color: P.purple } : undefined}
      >
        {children}
      </span>
    </button>
  );
}

export default function SearchPage() {
  // useSearchParams in a client component requires a Suspense boundary above,
  // otherwise Next.js throws during SSR.
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: Tab = tabParam === "students" ? "students" : "alumni";

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login?next=/kvisian");
  }, [authLoading, user, router]);

  const [tab, setTab] = useState<Tab>(initialTab);

  // Keep tab state in sync with URL when user clicks navbar deep-link.
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  // Alumni filters
  const [activeCohort, setActiveCohort] = useState<number | "all">("all");
  const [activeCountry, setActiveCountry] = useState<string>("");

  // Student filters
  const [activeGrade, setActiveGrade] = useState<number | "all">("all");
  const [activeClass, setActiveClass] = useState<number | "all">("all");
  const [activeElement, setActiveElement] = useState<Element | "all">("all");

  // Shared search box (per-tab UX, but we keep one state and reset on tab switch)
  const [q, setQ] = useState("");

  const { data: rawPeople = [], isLoading } = useQuery({
    queryKey: ["yearbook-all"],
    queryFn: () =>
      api
        .get<UserCard[]>("/api/search", {
          params: { sort: "kvis_year", order: "asc", limit: 1000 },
        })
        .then((r) => r.data),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // In dev, if the backend has no current students yet, splice in the fixture
  // so the "Current Students" tab is populated. Real data always wins.
  const people = useMemo(() => {
    const isDev = process.env.NODE_ENV !== "production";
    const hasStudents = rawPeople.some((p) => p.current_grade);
    if (!isDev || hasStudents) return rawPeople;
    return [...rawPeople, ...MOCK_CURRENT_STUDENTS];
  }, [rawPeople]);

  // Split: a person is a current student if current_grade is set
  const alumni = useMemo(
    () => people.filter((p) => !p.current_grade),
    [people],
  );
  const students = useMemo(
    () => people.filter((p) => !!p.current_grade),
    [people],
  );

  // Alumni-side derived data
  const countries = useMemo(() => {
    const m = new Map<string, number>();
    alumni.forEach((a) => {
      if (a.country) m.set(a.country, (m.get(a.country) ?? 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 14);
  }, [alumni]);

  const filteredAlumni = useMemo(() => {
    const qLow = q.trim().toLowerCase();
    return alumni.filter((a) => {
      if (activeCohort !== "all" && a.kvis_year !== activeCohort) return false;
      if (activeCountry && a.country !== activeCountry) return false;
      if (qLow) {
        const name = `${a.first_name} ${a.last_name}`.toLowerCase();
        const job = a.career?.[0];
        const edu = a.education?.[0];
        const hay = [
          name,
          a.country,
          job?.job_title,
          job?.employer,
          edu?.major,
          edu?.uni_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(qLow)) return false;
      }
      return true;
    });
  }, [alumni, activeCohort, activeCountry, q]);

  const byCohort = useMemo(() => {
    const m = new Map<number, UserCard[]>();
    filteredAlumni.forEach((a) => {
      const k = a.kvis_year ?? 0;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(a);
    });
    m.forEach((arr) =>
      arr.sort((x, y) =>
        (x.first_name || "").localeCompare(y.first_name || ""),
      ),
    );
    return m;
  }, [filteredAlumni]);

  // Students-side derived data - fixed 4 classes; count members per class.
  const classCounts = useMemo(() => {
    const m = new Map<number, number>();
    students.forEach((s) => {
      if (s.current_class) m.set(s.current_class, (m.get(s.current_class) ?? 0) + 1);
    });
    return m;
  }, [students]);

  const elementCounts = useMemo(() => {
    const m = new Map<Element, number>();
    students.forEach((s) => {
      if (s.current_elemental) m.set(s.current_elemental, (m.get(s.current_elemental) ?? 0) + 1);
    });
    return m;
  }, [students]);

  const filteredStudents = useMemo(() => {
    const qLow = q.trim().toLowerCase();
    return students.filter((s) => {
      if (activeGrade !== "all" && s.current_grade !== activeGrade) return false;
      if (activeClass !== "all" && s.current_class !== activeClass) return false;
      if (activeElement !== "all" && s.current_elemental !== activeElement) return false;
      if (qLow) {
        const name = `${s.first_name} ${s.last_name}`.toLowerCase();
        if (!name.includes(qLow)) return false;
      }
      return true;
    });
  }, [students, activeGrade, activeClass, activeElement, q]);

  const byGrade = useMemo(() => {
    const m = new Map<number, UserCard[]>();
    filteredStudents.forEach((s) => {
      const g = s.current_grade ?? 0;
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(s);
    });
    return m;
  }, [filteredStudents]);

  const hasFilter =
    tab === "alumni"
      ? activeCohort !== "all" || !!activeCountry || q.trim().length > 0
      : activeGrade !== "all" ||
        activeClass !== "all" ||
        activeElement !== "all" ||
        q.trim().length > 0;

  const resetFilters = () => {
    if (tab === "alumni") {
      setActiveCohort("all");
      setActiveCountry("");
    } else {
      setActiveGrade("all");
      setActiveClass("all");
      setActiveElement("all");
    }
    setQ("");
  };

  const switchTab = (t: Tab) => {
    if (t === tab) return;
    setTab(t);
    setQ("");
    // Reflect tab in URL so the navbar highlight + back-button work.
    const next = t === "students" ? "/kvisian?tab=students" : "/kvisian";
    router.replace(next, { scroll: false });
  };

  if (authLoading || !user) {
    return (
      <div className="mx-auto max-w-6xl px-6 lg:px-10 py-10 lg:py-14">
        <Skeleton className="h-32 w-full mb-8" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-5 gap-y-7">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-square mb-2" />
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isAlumni = tab === "alumni";
  const activeList = isAlumni ? filteredAlumni : filteredStudents;
  const masterList = isAlumni ? alumni : students;
  const unitWord = isAlumni ? "alumni" : "students";

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-6xl px-6 lg:px-10 py-10 lg:py-14">
        {/* Masthead */}
        <header className="pb-7 border-b border-foreground/60">
          <p
            className="text-xs font-bold uppercase tracking-[0.3em] mb-3"
            style={{ color: P.purple }}
          >
            KVIS Connect · Directory
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95] text-foreground">
            {isAlumni ? "Yearbook" : "Current Class"}
          </h1>
          <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed whitespace-nowrap overflow-hidden text-ellipsis">
            {isAlumni
              ? "Every alum, grouped by cohort. Filter by year, country, or name."
              : "Every student, grouped by grade. Filter by class, house, or name."}
          </p>
          <div
            className="flex items-center gap-3 md:gap-4 mt-6 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap"
            style={{ color: P.text3 }}
          >
            {isAlumni ? (
              <>
                <span>{alumni.length} alumni</span>
                <span aria-hidden>·</span>
                <span>{COHORT_YEARS.length} cohorts</span>
                <span aria-hidden>·</span>
                <span>{countries.length} countries</span>
              </>
            ) : (
              <>
                <span>{students.length} students</span>
                <span aria-hidden>·</span>
                <span>{GRADES.length} grades</span>
                <span aria-hidden>·</span>
                <span>{CLASSES.length} classes</span>
                <span aria-hidden>·</span>
                <span>{ELEMENTS.length} elements</span>
              </>
            )}
          </div>
        </header>

        {/* Tab toggle */}
        <div
          className="flex items-center gap-7 pt-5 pb-1 border-b"
          style={{ borderColor: P.rule }}
        >
          <TabButton active={isAlumni} onClick={() => switchTab("alumni")}>
            Alumni
          </TabButton>
          <TabButton active={!isAlumni} onClick={() => switchTab("students")}>
            Current Students
          </TabButton>
        </div>

        {/* Filter rail */}
        <nav className="pt-2 pb-2">
          {isAlumni ? (
            <>
              <FilterRow label="Cohort">
                <FilterButton
                  active={activeCohort === "all"}
                  onClick={() => setActiveCohort("all")}
                >
                  All
                </FilterButton>
                {COHORT_YEARS.map((y) => (
                  <FilterButton
                    key={y}
                    active={activeCohort === y}
                    onClick={() => setActiveCohort(activeCohort === y ? "all" : y)}
                  >
                    K{y}
                  </FilterButton>
                ))}
              </FilterRow>

              {countries.length > 0 && (
                <FilterRow label="Country">
                  <FilterButton
                    active={!activeCountry}
                    onClick={() => setActiveCountry("")}
                  >
                    All
                  </FilterButton>
                  {countries.map(([c, n]) => (
                    <FilterButton
                      key={c}
                      active={activeCountry === c}
                      onClick={() => setActiveCountry(activeCountry === c ? "" : c)}
                      count={n}
                    >
                      {c}
                    </FilterButton>
                  ))}
                </FilterRow>
              )}
            </>
          ) : (
            <>
              <FilterRow label="Grade">
                <FilterButton
                  active={activeGrade === "all"}
                  onClick={() => setActiveGrade("all")}
                >
                  All
                </FilterButton>
                {GRADES.map((g) => (
                  <FilterButton
                    key={g}
                    active={activeGrade === g}
                    onClick={() => setActiveGrade(activeGrade === g ? "all" : g)}
                  >
                    {gradeLabel(g)}
                  </FilterButton>
                ))}
              </FilterRow>

              <FilterRow label="Class">
                <FilterButton
                  active={activeClass === "all"}
                  onClick={() => setActiveClass("all")}
                >
                  All
                </FilterButton>
                {CLASSES.map((c) => (
                  <FilterButton
                    key={c}
                    active={activeClass === c}
                    onClick={() => setActiveClass(activeClass === c ? "all" : c)}
                    count={classCounts.get(c) ?? 0}
                  >
                    {c}
                  </FilterButton>
                ))}
              </FilterRow>

              <FilterRow label="Element">
                <FilterButton
                  active={activeElement === "all"}
                  onClick={() => setActiveElement("all")}
                >
                  All
                </FilterButton>
                {ELEMENTS.map((e) => (
                  <FilterButton
                    key={e}
                    active={activeElement === e}
                    onClick={() => setActiveElement(activeElement === e ? "all" : e)}
                    count={elementCounts.get(e) ?? 0}
                  >
                    {ELEMENT_LABEL[e]}
                  </FilterButton>
                ))}
              </FilterRow>
            </>
          )}

          {/* Search row */}
          <div
            className="grid grid-cols-[72px_1fr] md:grid-cols-[100px_1fr] items-center gap-x-5 py-2 border-t border-b"
            style={{ borderColor: P.rule }}
          >
            <span
              className="text-xs uppercase tracking-[0.26em] font-bold"
              style={{ color: P.text3 }}
            >
              Find
            </span>
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={
                  isAlumni
                    ? "Search by name, university, employer…"
                    : "Search by name…"
                }
                className="flex-1 bg-transparent border-0 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
              {hasFilter && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs uppercase tracking-[0.22em] font-bold inline-flex items-center gap-1.5 hover:text-foreground transition-colors shrink-0"
                  style={{ color: P.text3 }}
                >
                  <X className="h-3 w-3" /> Reset
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Roll */}
        {isLoading && (
          <div className="pt-10 space-y-10">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-16 w-full mb-6" />
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-5 gap-y-7">
                  {Array.from({ length: 14 }).map((_, j) => (
                    <div key={j}>
                      <Skeleton className="aspect-square mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && activeList.length === 0 && (
          <div className="py-24 text-center">
            <p
              className="text-xs uppercase tracking-[0.28em] font-bold mb-4"
              style={{ color: P.text3 }}
            >
              Nothing matches
            </p>
            <p className="text-3xl font-black tracking-tight text-foreground mb-3">
              {isAlumni
                ? "No alumni match this filter"
                : "No current students match"}
            </p>
            {hasFilter && (
              <button
                onClick={resetFilters}
                className="text-sm underline"
                style={{ color: P.purple }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {!isLoading && activeList.length > 0 && (
          <>
            {isAlumni
              ? COHORT_YEARS.map((k) => {
                  const arr = byCohort.get(k) ?? [];
                  return arr.length > 0 ? (
                    <CohortSection key={k} k={k} students={arr} />
                  ) : null;
                })
              : GRADES.map((g) => {
                  const arr = byGrade.get(g) ?? [];
                  return arr.length > 0 ? (
                    <GradeSection key={g} g={g} students={arr} />
                  ) : null;
                })}
          </>
        )}

        {!isLoading && activeList.length > 0 && (
          <footer className="mt-20 pt-6 border-t border-foreground/60 text-muted-foreground text-xs uppercase tracking-[0.22em] flex items-center justify-between">
            <span>- end -</span>
            <span className="tabular-nums">
              {activeList.length} {unitWord}
              {hasFilter && ` (of ${masterList.length})`}
            </span>
          </footer>
        )}
      </div>
    </div>
  );
}
