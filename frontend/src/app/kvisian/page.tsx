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
import { Search, X, ChevronDown, ArrowUpDown, Dot } from "lucide-react";
import type { DirectoryCard } from "@/lib/types";
import { PageEntrance, FadeUp } from "@/components/ui/motion";
import {
  effectiveKvisYear,
  genLabel,
  isFaculty,
  facultyPeriodLabel,
  FACULTY_COLOR,
  cohortColor,
} from "@/lib/utils";
import { motion } from "framer-motion";
import { AvatarCanvas } from "@/components/avatar/AvatarCanvas";
import type { AvatarConfig } from "@/lib/avatarTypes";

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
};
const staggerChild = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};
const ANIMATE_FIRST_N = 10;

type PersonType = "all" | "alumni" | "students" | "faculty";

const COHORT_YEARS_ASC = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const COHORT_YEARS_DESC = [9, 8, 7, 6, 5, 4, 3, 2, 1];
const GRADES = [12, 11, 10];

const LATEST_COHORT = 9; // keep in sync with utils.ts
function gradeToKvisYear(g: number) {
  if (g === 12) return LATEST_COHORT + 1;
  if (g === 11) return LATEST_COHORT + 2;
  if (g === 10) return LATEST_COHORT + 3;
  return LATEST_COHORT + 1;
}
function gradeBadgeLabel(g: number) {
  return `K${gradeToKvisYear(g)}`;
}
function gradeGradYear(g: number) {
  return 2017 + gradeToKvisYear(g);
}
function gradeMetaLabel(g: number) {
  return `Class of ${gradeGradYear(g)}`;
}
function cohortGradYear(k: number) {
  return 2017 + k;
}
function initials(u: DirectoryCard) {
  return `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase();
}

function captionAlumni(u: any): React.ReactNode {
  // Current education takes priority if flagged
  if (u.edu_major && !u.job_title) {
    return [u.edu_major || u.edu_degree, u.edu_uni].filter(Boolean).join(" • ");
  }
  // Current job
  if (u.job_title) {
    return [u.job_title, u.employer && `@ ${u.employer}`].filter(Boolean).join(" ");
  }
  // Fallback to education
  if (u.edu_major) {
    return [u.edu_major || u.edu_degree, u.edu_uni].filter(Boolean).join(" • ");
  }
  return "Profile pending";
}

function captionStudent(u: DirectoryCard): React.ReactNode {
  if (u.interests) {
    const interests = u.interests
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 2);
    return (
      <>
        {interests.map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <Dot className="h-3 w-3 shrink-0" aria-hidden />}
            {item}
          </span>
        ))}
      </>
    );
  }
  return "KVIS Student";
}

function captionFaculty(u: DirectoryCard): string {
  return facultyPeriodLabel(u);
}

// Portrait card
function Portrait({ u }: { u: DirectoryCard }) {
  const faculty = isFaculty(u);
  const kvisYear = effectiveKvisYear(u);
  const accentColor = faculty ? FACULTY_COLOR : cohortColor(kvisYear);
  const placeholderBg = faculty
    ? FACULTY_COLOR
    : kvisYear && kvisYear % 2 === 0
      ? "var(--kvis-green)"
      : "var(--kvis-purple)";

  const caption = faculty
    ? captionFaculty(u)
    : u.current_grade
      ? captionStudent(u)
      : captionAlumni(u);

  const classOfLabel = faculty
    ? null
    : u.current_grade
      ? gradeMetaLabel(u.current_grade)
      : u.kvis_year
        ? `Class of ${cohortGradYear(u.kvis_year)}`
        : null;

  const isGoose = !!u.goose_config;
  const gooseConfig = isGoose ? (() => { try { return JSON.parse(u.goose_config!); } catch { return null; } })() as AvatarConfig | null : null;

  return (
    <Link href={`/profile/${u.slug ?? u.id}`} className="group block">
      {/* Photo - 1:1 square, circle for goose profiles */}
      <div
        className={`relative w-full overflow-hidden ${isGoose ? "rounded-full" : ""}`}
        style={{
          aspectRatio: "1 / 1",
          background: isGoose ? "var(--kvis-green)" : "var(--kvis-rule)",
        }}
      >
        {isGoose && gooseConfig ? (
          <AvatarCanvas config={gooseConfig} backgroundColor="var(--kvis-green)" />
        ) : u.profile_pic_url ? (
          <Image
            src={u.profile_pic_url}
            alt={`${u.first_name} ${u.last_name}`}
            fill
            sizes="200px"
            className="object-cover grayscale-[30%] group-hover:grayscale-0 transition-[filter] duration-500"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: placeholderBg }}
          >
            <span
              className="text-2xl font-black leading-none select-none tracking-[-0.02em]"
              style={{ color: "white" }}
            >
              {initials(u)}
            </span>
          </div>
        )}
      </div>

      {/* Info - text flows beneath photo */}
      <div className="pt-2 min-w-0">
        <p className="text-sm font-bold leading-tight group-hover:underline decoration-2 underline-offset-[3px] truncate"
          style={{ color: "var(--kvis-ink)", textDecorationColor: accentColor }}
        >
          {u.first_name} {u.last_name}
        </p>
        {classOfLabel && (
          <p
            className="text-[10px] font-bold uppercase tracking-[0.16em] mt-0.5"
            style={{ color: accentColor }}
          >
            {classOfLabel}
          </p>
        )}
        {caption && (
          <p
            className="text-xs leading-snug mt-0.5"
            style={{ color: "var(--kvis-text3)" }}
          >
            {caption}
          </p>
        )}
        {u.country && (
          <p
            className="text-xs font-medium uppercase tracking-[0.13em] mt-1.5"
            style={{ color: "var(--kvis-text3)", opacity: 0.65 }}
          >
            {u.country}
          </p>
        )}
      </div>
    </Link>
  );
}

// Section headers
function SectionHeader({
  display,
  meta,
  count,
  unitLabel,
  kvis_year,
  isFacultyHeader,
}: {
  display: string;
  meta: string;
  count: number;
  unitLabel: string;
  kvis_year?: number;
  isFacultyHeader?: boolean;
}) {
  const color = isFacultyHeader ? FACULTY_COLOR : cohortColor(kvis_year);
  return (
    <header className="flex items-baseline justify-between gap-6 pb-4 border-b border-[var(--kvis-border)] mb-6">
      <div className="flex items-baseline gap-5">
        <h2 className="font-display text-3xl md:text-4xl font-black tracking-[-0.03em] leading-none text-foreground tabular-nums">
          {display}
        </h2>
        <p
          className="text-xs font-bold uppercase tracking-[0.26em]"
          style={{ color }}
        >
          {meta}
        </p>
      </div>
      <p className="text-xs uppercase tracking-[0.22em] tabular-nums text-[var(--kvis-text3)]">
        {count} {unitLabel}
      </p>
    </header>
  );
}

function CohortSection({
  k,
  students,
}: {
  k: number;
  students: DirectoryCard[];
}) {
  if (!students.length) return null;
  return (
    <FadeUp>
      <section className="pt-6">
        <SectionHeader
          display={`KVIS ${k}`}
          meta={`Class of ${cohortGradYear(k)}`}
          count={students.length}
          unitLabel="alumni"
          kvis_year={k}
        />
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-6"
        >
          {students.map((s, i) =>
            i < ANIMATE_FIRST_N ? (
              <motion.div key={s.id} variants={staggerChild}>
                <Portrait u={s} />
              </motion.div>
            ) : (
              <div key={s.id}>
                <Portrait u={s} />
              </div>
            ),
          )}
        </motion.div>
      </section>
    </FadeUp>
  );
}

function GradeSection({
  g,
  students,
}: {
  g: number;
  students: DirectoryCard[];
}) {
  if (!students.length) return null;
  const pseudoYear = effectiveKvisYear({ current_grade: g });
  const sorted = [...students].sort((a, b) =>
    (a.first_name || "").localeCompare(b.first_name || ""),
  );
  return (
    <FadeUp>
      <section className="pt-14">
        <SectionHeader
          display={`KVIS ${gradeToKvisYear(g)}`}
          meta={gradeMetaLabel(g)}
          count={sorted.length}
          unitLabel="students"
          kvis_year={pseudoYear ?? undefined}
        />
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-6"
        >
          {sorted.map((s, i) =>
            i < ANIMATE_FIRST_N ? (
              <motion.div key={s.id} variants={staggerChild}>
                <Portrait u={s} />
              </motion.div>
            ) : (
              <div key={s.id}>
                <Portrait u={s} />
              </div>
            ),
          )}
        </motion.div>
      </section>
    </FadeUp>
  );
}

function FacultySection({ people }: { people: DirectoryCard[] }) {
  if (!people.length) return null;
  const sorted = [...people].sort(
    (a, b) =>
      (a.teach_start_year ?? 9999) - (b.teach_start_year ?? 9999) ||
      (a.first_name || "").localeCompare(b.first_name || ""),
  );
  return (
    <FadeUp>
      <section className="pt-14">
        <SectionHeader
          display="Faculty"
          meta="KVIS Teachers & Staff"
          count={sorted.length}
          unitLabel="members"
          isFacultyHeader
        />
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-6"
        >
          {sorted.map((s, i) =>
            i < ANIMATE_FIRST_N ? (
              <motion.div key={s.id} variants={staggerChild}>
                <Portrait u={s} />
              </motion.div>
            ) : (
              <div key={s.id}>
                <Portrait u={s} />
              </div>
            ),
          )}
        </motion.div>
      </section>
    </FadeUp>
  );
}

// Dropdown filter
function DropFilter({
  label,
  active,
  options,
  value,
  onChange,
  sortIcon = false,
}: {
  label: string;
  active: boolean;
  options: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (v: string) => void;
  sortIcon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? label;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] border transition-colors rounded-sm"
        style={{
          borderColor: active ? "var(--kvis-purple-light)" : "var(--kvis-border)",
          color: active ? "var(--kvis-purple-light)" : "var(--kvis-text3)",
          background: active
            ? "color-mix(in oklch, var(--kvis-purple-light) 14%, transparent)"
            : "transparent",
        }}
      >
        {sortIcon && <ArrowUpDown className="h-3 w-3" />}
        {active ? selectedLabel : label}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 min-w-[150px] border border-[var(--kvis-border)] bg-background shadow-lg rounded-sm overflow-hidden">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-colors hover:bg-foreground/5 text-left"
                style={{
                  color:
                    o.value === value
                      ? "var(--kvis-purple-light)"
                      : "var(--kvis-text3)",
                }}
              >
                {o.label}
                {o.count !== undefined && (
                  <span className="text-xs tabular-nums ml-3 opacity-50">
                    {o.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Main page (inner)
function KvisianInner() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (user.profile_setup_done === false) {
      router.push("/onboarding");
    }
  }, [authLoading, user, router]);

  const [personType, setPersonType] = useState<PersonType>("all");
  const [activeCohort, setActiveCohort] = useState("");
  const [activeCountry, setActiveCountry] = useState("");
  const [activeGrade, setActiveGrade] = useState("");
  const [activeField, setActiveField] = useState("");
  const [activeUni, setActiveUni] = useState("");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<
    "cohort-asc" | "cohort-desc" | "name-asc" | "name-desc"
  >("cohort-asc");

  const {
    data: rawPeople = [],
    isLoading,
    error,
  } = useQuery<DirectoryCard[]>({
    queryKey: ["directory"],
    queryFn: () =>
      api.get<DirectoryCard[]>("/api/search/directory").then((r) => {
        console.log("directory data:", r.data?.length, r.data?.[0]);
        return r.data;
      }),
    staleTime: 5 * 60 * 1000,
    enabled: !authLoading && !!user,
  });

  console.log(
    "rawPeople:",
    rawPeople.length,
    "isLoading:",
    isLoading,
    "error:",
    error,
    "authLoading:",
    authLoading,
    "user:",
    !!user,
  );

  // Partition
  const facultyAll = useMemo(
    () => rawPeople.filter((u) => isFaculty(u)),
    [rawPeople],
  );
  const alumniAll = useMemo(
    () => rawPeople.filter((u) => !isFaculty(u) && !u.current_grade),
    [rawPeople],
  );
  const studentsAll = useMemo(
    () => rawPeople.filter((u) => !isFaculty(u) && !!u.current_grade),
    [rawPeople],
  );

  const countries = useMemo(() => {
    const m = new Map<string, number>();
    rawPeople.forEach((u) => {
      if (u.country) m.set(u.country, (m.get(u.country) ?? 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [rawPeople]);

  // Source list based on personType
  const sourceList = useMemo(() => {
    if (personType === "alumni") return alumniAll;
    if (personType === "students") return studentsAll;
    if (personType === "faculty") return facultyAll;
    return rawPeople;
  }, [personType, rawPeople, alumniAll, studentsAll, facultyAll]);

  // Filter
  const filtered = useMemo(() => {
    return sourceList.filter((u) => {
      if (activeCohort && u.kvis_year !== parseInt(activeCohort)) return false;
      if (activeCountry && u.country !== activeCountry) return false;
      if (activeGrade && u.current_grade !== parseInt(activeGrade))
        return false;
      if (activeField) {
        if (u.job_field !== activeField) return false;
      }
      if (activeUni) {
        if (u.edu_uni !== activeUni) return false;
      }
      if (q.trim()) {
        const qLow = q.toLowerCase();
        const hay = [
          u.first_name,
          u.last_name,
          u.country,
          u.place,
          u.mbti,
          u.interests,
          u.job_title,
          u.employer,
          u.job_field,
          u.edu_major,
          u.edu_uni,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(qLow)) return false;
      }
      return true;
    });
  }, [
    sourceList,
    activeCohort,
    activeCountry,
    activeGrade,
    activeField,
    activeUni,
    q,
  ]);

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "name-asc")
        return (a.first_name || "").localeCompare(b.first_name || "");
      if (sortBy === "name-desc")
        return (b.first_name || "").localeCompare(a.first_name || "");
      const ky_a = effectiveKvisYear(a) ?? 999;
      const ky_b = effectiveKvisYear(b) ?? 999;
      if (sortBy === "cohort-desc") return ky_b - ky_a;
      return ky_a - ky_b;
    });
  }, [filtered, sortBy]);

  const byCohort = useMemo(() => {
    const m = new Map<number, DirectoryCard[]>();
    filtered
      .filter((u) => !isFaculty(u) && !u.current_grade)
      .forEach((a) => {
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
  }, [filtered]);

  const byGrade = useMemo(() => {
    const m = new Map<number, DirectoryCard[]>();
    filtered
      .filter((u) => !isFaculty(u) && !!u.current_grade)
      .forEach((s) => {
        const g = s.current_grade ?? 0;
        if (!m.has(g)) m.set(g, []);
        m.get(g)!.push(s);
      });
    return m;
  }, [filtered]);

  const filteredFaculty = useMemo(
    () => filtered.filter((u) => isFaculty(u)),
    [filtered],
  );

  const showSectionHeaders =
    !activeCohort &&
    !activeCountry &&
    !activeGrade &&
    !activeField &&
    !activeUni &&
    !q.trim() &&
    (sortBy === "cohort-asc" || sortBy === "cohort-desc");

  const hasRealFilter =
    !!activeCohort ||
    !!activeCountry ||
    !!activeGrade ||
    !!activeField ||
    !!activeUni ||
    q.trim().length > 0;

  const resetFilters = () => {
    setPersonType("all");
    setActiveCohort("");
    setActiveCountry("");
    setActiveGrade("");
    setActiveField("");
    setActiveUni("");
    setQ("");
  };

  const showAlumni = personType === "all" || personType === "alumni";
  const showStudents = personType === "all" || personType === "students";
  const showFaculty = personType === "all" || personType === "faculty";

  if (authLoading || !user) {
    return (
      <PageEntrance>
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-xl lg:py-layout">
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-6">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="w-full" style={{ aspectRatio: "1 / 1" }} />
                <div className="pt-2 flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
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
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-xl lg:py-layout">
          <FadeUp>
            <header className="pb-7 border-b border-[var(--sep-strong)]">
              <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 text-[var(--kvis-green-light)] flex items-center">
                KVIS Connect <Dot className="h-6 w-6 shrink-0" aria-hidden /> Directory
              </p>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95]">
                <span className="font-light text-foreground">Find your </span>
                <span style={{ color: "var(--kvis-purple)" }}>People</span>
              </h1>
              <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-[60ch] leading-relaxed">
                Browse {rawPeople.length} registered Kvisians by cohort,
                country, field, and interests.
                <br />
                Data reflects members who have joined KVIS Connect and may not
                represent the full alumni or student body.
              </p>
              <div className="flex items-center gap-3 md:gap-4 mt-6 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap text-[var(--kvis-text3)]">
                <span>{alumniAll.length} alumni</span>
                <Dot className="h-3 w-3 text-[var(--kvis-text3)] shrink-0" />
                <span>{studentsAll.length} students</span>
                <Dot className="h-3 w-3 text-[var(--kvis-text3)] shrink-0" />
                {facultyAll.length > 0 && (
                  <>
                    <span>{facultyAll.length} faculty</span>
                    <Dot className="h-3 w-3 text-[var(--kvis-text3)] shrink-0" />
                  </>
                )}
                <span>{countries.length} countries</span>
              </div>
            </header>
          </FadeUp>

          <FadeUp delay={0.1}>
            <nav className="py-4 space-y-3">
              {/* Search */}
              <div className="flex items-center gap-3 px-3 py-2 border border-[var(--kvis-border)] rounded-sm">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name, interest (chess, photography...), field, university..."
                  className="flex-1 bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
                {q && (
                  <button onClick={() => setQ("")}>
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Person-type pills */}
              <div className="flex items-center flex-wrap gap-2">
                {(["all", "alumni", "students", "faculty"] as PersonType[]).map(
                  (t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setPersonType(t);
                        setActiveCohort("");
                        setActiveGrade("");
                        setActiveField("");
                        setActiveUni("");
                      }}
                      className="px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] border transition-colors rounded-sm"
                      style={{
                        borderColor:
                          personType === t
                            ? "var(--kvis-purple-light)"
                            : "var(--kvis-border)",
                        color:
                          personType === t
                            ? "var(--kvis-purple-light)"
                            : "var(--kvis-text3)",
                        background:
                          personType === t
                            ? "color-mix(in oklch, var(--kvis-purple-light) 14%, transparent)"
                            : "transparent",
                      }}
                    >
                      {t === "all"
                        ? "Everyone"
                        : t === "alumni"
                          ? "Alumni"
                          : t === "students"
                            ? "Students"
                            : "Faculty"}
                    </button>
                  ),
                )}

                <div className="w-px h-4 bg-[var(--kvis-border)]" />

                <DropFilter
                  label="Anywhere"
                  active={!!activeCountry}
                  value={activeCountry}
                  onChange={setActiveCountry}
                  options={[
                    { value: "", label: "Anywhere" },
                    ...countries.map(([c, n]: [string, number]) => ({
                      value: c,
                      label: c,
                      count: n,
                    })),
                  ]}
                />

                {(personType === "all" || personType === "alumni") && (
                  <DropFilter
                    label="Any cohort"
                    active={!!activeCohort}
                    value={activeCohort}
                    onChange={setActiveCohort}
                    options={[
                      { value: "", label: "Any cohort" },
                      ...COHORT_YEARS_DESC.map((y) => ({
                        value: String(y),
                        label: `K${y}`,
                      })),
                    ]}
                  />
                )}

                {(personType === "all" || personType === "students") && (
                  <>
                    <DropFilter
                      label="Any grade"
                      active={!!activeGrade}
                      value={activeGrade}
                      onChange={setActiveGrade}
                      options={[
                        { value: "", label: "Any grade" },
                        ...GRADES.map((g) => ({
                          value: String(g),
                          label: `K${gradeToKvisYear(g)} (M.${g - 6})`,
                        })),
                      ]}
                    />
                  </>
                )}

                <DropFilter
                  label="Sort"
                  active={sortBy !== "cohort-asc"}
                  value={sortBy}
                  onChange={(v) => setSortBy(v as typeof sortBy)}
                  sortIcon
                  options={[
                    { value: "cohort-asc", label: "Cohort ↑" },
                    { value: "cohort-desc", label: "Cohort ↓" },
                    { value: "name-asc", label: "Name A–Z" },
                    { value: "name-desc", label: "Name Z–A" },
                  ]}
                />

                {hasRealFilter && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] border border-[var(--kvis-border)] rounded-sm text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>
            </nav>
          </FadeUp>

          {/* Results */}
          {showSectionHeaders ? (
            <>
              {sortBy === "cohort-desc" ? (
                <>
                  {/* Descending: students first (K12→K10), then alumni (K9→K1) */}
                  {showStudents &&
                    Array.from(byGrade.keys())
                      .sort((a, b) => a - b)
                      .map((g) => (
                        <GradeSection
                          key={g}
                          g={g}
                          students={byGrade.get(g) ?? []}
                        />
                      ))}
                  {showAlumni &&
                    Array.from(byCohort.keys())
                      .sort((a, b) => b - a)
                      .map((k) => (
                        <CohortSection
                          key={k}
                          k={k}
                          students={byCohort.get(k) ?? []}
                        />
                      ))}
                  {showFaculty && <FacultySection people={filteredFaculty} />}
                </>
              ) : (
                <>
                  {/* Ascending: alumni first (K1→K9), then students (K10→K12) */}
                  {showAlumni &&
                    Array.from(byCohort.keys())
                      .sort((a, b) => a - b)
                      .map((k) => (
                        <CohortSection
                          key={k}
                          k={k}
                          students={byCohort.get(k) ?? []}
                        />
                      ))}
                  {showStudents &&
                    Array.from(byGrade.keys())
                      .sort((a, b) => b - a)
                      .map((g) => (
                        <GradeSection
                          key={g}
                          g={g}
                          students={byGrade.get(g) ?? []}
                        />
                      ))}
                  {showFaculty && <FacultySection people={filteredFaculty} />}
                </>
              )}
            </>
          ) : (
            <FadeUp delay={0.2}>
              <div className="pt-10">
                <p className="text-xs uppercase tracking-[0.26em] font-bold mb-6 text-[var(--kvis-text3)]">
                  {sortedFiltered.length} result
                  {sortedFiltered.length !== 1 ? "s" : ""}
                </p>
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-6"
                >
                  {sortedFiltered.map((u: DirectoryCard, i) =>
                    i < ANIMATE_FIRST_N ? (
                      <motion.div
                        key={u.id}
                        variants={staggerChild}
                      >
                        <Portrait u={u} />
                      </motion.div>
                    ) : (
                      <div key={u.id}>
                        <Portrait u={u} />
                      </div>
                    ),
                  )}
                </motion.div>
                {sortedFiltered.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-16">
                    No results -{" "}
                    <button onClick={resetFilters} className="underline">
                      clear filters
                    </button>
                  </p>
                )}
              </div>
            </FadeUp>
          )}
        </div>
      </div>
    </PageEntrance>
  );
}

export default function KvisianPage() {
  return (
    <Suspense>
      <KvisianInner />
    </Suspense>
  );
}
