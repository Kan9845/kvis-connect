"use client";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { ArrowRight, ArrowLeft, Dot } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import api from "@/lib/api";
import { keys } from "@/lib/cache/keys";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FilterPill } from "@/components/ui/filter-pill";
import type { UserCard, Education, Career } from "@/lib/types";
import {
  PageEntrance,
  FadeUp,
  StaggerList,
  StaggerItem,
} from "@/components/ui/motion";
import { Separator } from "@/components/ui/separator";
import { cohortColor, isFaculty, normalizeCountryLabel } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const ISO_MAP: Record<string, string> = {
  Thailand: "th",
  "United States": "us",
  "United States of America": "us",
  USA: "us",
  "United Kingdom": "gb",
  UK: "gb",
  Germany: "de",
  Singapore: "sg",
  Canada: "ca",
  France: "fr",
  Netherlands: "nl",
  Switzerland: "ch",
  Japan: "jp",
  Australia: "au",
  "South Korea": "kr",
  Sweden: "se",
  Denmark: "dk",
  Norway: "no",
  Finland: "fi",
  Italy: "it",
  Spain: "es",
  China: "cn",
  India: "in",
  Brazil: "br",
  Austria: "at",
  Belgium: "be",
  Poland: "pl",
  Taiwan: "tw",
  "Hong Kong": "hk",
  "New Zealand": "nz",
  Israel: "il",
  Ireland: "ie",
  Russia: "ru",
};

const FIELD_COLORS: Record<string, string> = {
  "Mathematics & Data Science": "#7c6fcd",
  "Computer Science & Software Engineering": "#5b8dee",
  "Physical Sciences & Engineering": "#e8a838",
  "Chemical Sciences & Engineering": "#e0724a",
  "Life Sciences & Bioengineering": "#4caf86",
  "Earth, Space, & Environmental Sciences": "#6bab6b",
  "Non-STEM / Humanities / Social Sciences": "#aaa",
};

const STEM_FIELDS = new Set([
  "Mathematics & Data Science",
  "Computer Science & Software Engineering",
  "Physical Sciences & Engineering",
  "Chemical Sciences & Engineering",
  "Life Sciences & Bioengineering",
  "Earth, Space, & Environmental Sciences",
]);

function FlagImg({ country, size = 20 }: { country: string; size?: number }) {
  const iso = ISO_MAP[country];
  if (!iso)
    return (
      <span
        className="inline-block bg-[var(--kvis-rule)] rounded-[2px]"
        style={{ width: size * 1.4, height: size }}
      />
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      width={Math.round(size * 1.4)}
      height={size}
      alt={country}
      className="object-cover rounded-[2px] block shrink-0"
      style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.08)" }}
    />
  );
}

function classifyFaculty(edu: Education): string {
  return edu.field_of_study ?? "Non-STEM / Humanities / Social Sciences";
}

function primaryEducation(u: UserCard): Education | null {
  if (!u.education?.length) return null;
  const undergrad = u.education.find((e) =>
    /bachelor|undergrad|\bbs\b|\bba\b|\bbsc\b|\bbeng\b/i.test(e.degree ?? ""),
  );
  if (undergrad) return undergrad;
  return [...u.education].sort(
    (a, b) => (a.start_year ?? 9999) - (b.start_year ?? 9999),
  )[0];
}

function primaryCareer(u: UserCard): Career | null {
  if (!u.career?.length) return null;
  return (
    u.career.find((c) => c.is_current) ??
    [...u.career].sort((a, b) => (b.start_year ?? 0) - (a.start_year ?? 0))[0]
  );
}

type Row = {
  key: string;
  label: string;
  count: number;
  pct: number;
  rank: number;
};

function toRanked(map: Map<string, number>, total: number): Row[] {
  return Array.from(map, ([key, count]) => ({ key, label: key, count }))
    .sort((a, b) => b.count - a.count)
    .map((r, i) => ({
      ...r,
      pct: total > 0 ? (r.count / total) * 100 : 0,
      rank: i + 1,
    }));
}

// ── Stat figures ─────────────────────────────────────────────────────────────
// Clean typographic display - no card backgrounds, no side-stripe borders
function StatFigures({
  items,
}: {
  items: {
    value: string | number;
    label: string;
    sub: string;
    color: string;
  }[];
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="py-8 px-5 md:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--kvis-text3)] mb-3">
            {item.label}
          </p>
          <p
            className="font-display font-black tabular-nums leading-none text-2xl"
            style={{
              letterSpacing: "-0.04em",
              color: item.color,
            }}
          >
            {item.value}
          </p>
          <p className="mt-2 text-xs text-[var(--kvis-text3)]">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── Ranked list ───────────────────────────────────────────────────────────────
function RankedList({
  items,
  showFlag = false,
  barColor = "var(--kvis-purple-light)",
}: {
  items: Row[];
  showFlag?: boolean;
  barColor?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const CAP = 10;
  const visible = showAll ? items : items.slice(0, CAP);
  const hidden = items.length - CAP;
  return (
    <div>
      <StaggerList>
        {visible.map((it) => (
          <StaggerItem key={it.key}>
            <div
              className="grid items-center py-3 border-b border-[var(--kvis-rule)]"
              style={{
                gridTemplateColumns: "1.75rem minmax(0,1fr) 4rem 2.5rem 3rem",
                columnGap: "0.75rem",
              }}
            >
              <span className="text-xs font-mono tabular-nums font-semibold text-[var(--kvis-text3)]">
                {String(it.rank).padStart(2, "0")}
              </span>

              <div className="flex items-center gap-2 min-w-0">
                {showFlag && <FlagImg country={it.label} size={16} />}
                <span
                  className="font-semibold text-foreground text-sm leading-snug"
                  style={{ letterSpacing: "-0.005em" }}
                >
                  {it.label}
                </span>
              </div>

              {/* Bar with real visual weight */}
              <div className="h-2 rounded-full overflow-hidden bg-[var(--kvis-rule)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(it.pct, it.count > 0 ? 2 : 0)}%`,
                    background: barColor,
                    transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              </div>

              <span className="text-sm font-bold tabular-nums text-right text-foreground">
                {it.count}
              </span>
              <span className="text-sm tabular-nums text-right text-[var(--kvis-text3)]">
                {it.pct < 10 ? it.pct.toFixed(1) : Math.round(it.pct)}%
              </span>
            </div>
          </StaggerItem>
        ))}
      </StaggerList>

      {!showAll && hidden > 0 && (
        <Button
          variant="link"
          onClick={() => setShowAll(true)}
          className="mt-5 h-auto p-0 text-xs font-bold uppercase tracking-[0.22em] no-underline hover:underline text-[var(--kvis-purple-light)]"
          style={{
            textDecorationColor: "var(--kvis-purple-light)",
            textUnderlineOffset: 4,
          }}
        >
          See all {items.length} entries <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      )}
      {showAll && hidden > 0 && (
        <Button
          variant="link"
          onClick={() => setShowAll(false)}
          className="mt-5 h-auto p-0 text-xs font-bold uppercase tracking-[0.22em] no-underline hover:underline text-[var(--kvis-text3)]"
          style={{ textUnderlineOffset: 4 }}
        >
          <ArrowLeft className="h-3 w-3 mr-1" /> Collapse
        </Button>
      )}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHead({
  numeral,
  kicker,
  title,
  lede,
  accentColor = "var(--kvis-green-light)",
}: {
  numeral: string;
  kicker: string;
  title: string;
  lede?: string;
  accentColor?: string;
}) {
  return (
    <header className="pt-14 pb-6">
      <div className="flex items-baseline gap-4 mb-3">
        <span
          className="font-display font-black text-3xl tabular-nums"
          style={{ color: accentColor, letterSpacing: "-0.04em" }}
        >
          {numeral}
        </span>
        <span className="text-xs uppercase tracking-[0.28em] font-bold text-[var(--kvis-text3)] whitespace-nowrap">
          {kicker}
        </span>
      </div>
      <h2 className="text-xl md:text-2xl font-black tracking-[-0.025em] leading-[1.02] text-foreground">
        {title}
      </h2>
      {lede && (
        <p className="mt-4 text-base text-muted-foreground max-w-[58ch] leading-relaxed">
          {lede}
        </p>
      )}
    </header>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="py-12 border-t border-[var(--kvis-rule)]">
      <p className="text-sm text-muted-foreground italic">
        No {label} recorded for this selection.
      </p>
    </div>
  );
}

// ── Section divider label ─────────────────────────────────────────────────────
function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-[var(--kvis-rule)] mb-1">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-foreground">
        {children}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function readCssVar(name: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

export default function StatsClient({
  initialPeople = [],
}: {
  initialPeople?: UserCard[];
}) {
  const [cohort, setCohort] = useState<number | null>(null);
  const { resolvedTheme } = useTheme();
  const [chartTickColor, setChartTickColor] = useState("oklch(60% 0.006 294)");

  useEffect(() => {
    setChartTickColor(readCssVar("--kvis-text3", "oklch(60% 0.006 294)"));
  }, [resolvedTheme]);

  const { data: people = [], isLoading } = useQuery({
    queryKey: keys.stats.alumni(),
    queryFn: () =>
      api
        .get<
          UserCard[]
        >("/api/search", { params: { sort: "kvis_year", order: "asc", limit: 1000 } })
        .then((r) => r.data),
    initialData: initialPeople,
    staleTime: 5 * 60 * 1000,
  });

  // "Alumni" = registered Kvisians who are neither faculty nor current
  // students. This matches the alumni count shown on the kvisian page.
  const alumni = useMemo(
    () => people.filter((u) => !isFaculty(u) && !u.current_grade),
    [people],
  );

  const cohorts = useMemo(() => {
    const ys = new Set<number>();
    alumni.forEach((u) => {
      if (u.kvis_year) ys.add(u.kvis_year);
    });
    return Array.from(ys).sort((a, b) => a - b);
  }, [alumni]);

  const cohortCounts = useMemo(() => {
    const m = new Map<number, number>();
    alumni.forEach((u) => {
      if (u.kvis_year) m.set(u.kvis_year, (m.get(u.kvis_year) ?? 0) + 1);
    });
    return m;
  }, [alumni]);

  const filtered = useMemo(
    () =>
      cohort === null ? alumni : alumni.filter((u) => u.kvis_year === cohort),
    [alumni, cohort],
  );

  const totalEdu = useMemo(
    () => filtered.reduce((s, u) => s + (primaryEducation(u) ? 1 : 0), 0),
    [filtered],
  );

  const totalWithField = useMemo(
    () => filtered.reduce((s, u) => {
      const e = primaryEducation(u);
      return e?.field_of_study ? s + 1 : s;
    }, 0),
    [filtered],
  );

  const stemCount = useMemo(
    () =>
      filtered.reduce((s, u) => {
        const e = primaryEducation(u);
        if (!e?.field_of_study) return s;
        return STEM_FIELDS.has(classifyFaculty(e)) ? s + 1 : s;
      }, 0),
    [filtered],
  );

  const facultyRanked = useMemo(() => {
    const c = new Map<string, number>();
    filtered.forEach((u) => {
      const e = primaryEducation(u);
      if (!e?.field_of_study) return;
      const f = classifyFaculty(e);
      c.set(f, (c.get(f) ?? 0) + 1);
    });
    return toRanked(c, totalWithField);
  }, [filtered, totalWithField]);

  const uniRanked = useMemo(() => {
    const c = new Map<string, number>();
    filtered.forEach((u) => {
      const e = primaryEducation(u);
      if (!e?.uni_name) return;
      c.set(e.uni_name, (c.get(e.uni_name) ?? 0) + 1);
    });
    return toRanked(c, totalEdu);
  }, [filtered, totalEdu]);

  const countryRanked = useMemo(() => {
    const c = new Map<string, number>();
    filtered.forEach((u) => {
      const e = primaryEducation(u);
      const country = normalizeCountryLabel(e?.country);
      if (!country) return;
      c.set(country, (c.get(country) ?? 0) + 1);
    });
    return toRanked(c, totalEdu);
  }, [filtered, totalEdu]);

  const totalCareer = useMemo(
    () => filtered.reduce((s, u) => s + (primaryCareer(u) ? 1 : 0), 0),
    [filtered],
  );
 
  const industryRanked = useMemo(() => {
    const c = new Map<string, number>();
    filtered.forEach((u) => {
      const job = primaryCareer(u);
      if (!job?.industry_sector) return;
      c.set(job.industry_sector, (c.get(job.industry_sector) ?? 0) + 1);
    });
    return toRanked(c, totalCareer);
  }, [filtered, totalCareer]);
 
  const roleTypeRanked = useMemo(() => {
    const c = new Map<string, number>();
    filtered.forEach((u) => {
      const job = primaryCareer(u);
      if (!job?.role_type) return;
      c.set(job.role_type, (c.get(job.role_type) ?? 0) + 1);
    });
    return toRanked(c, totalCareer);
  }, [filtered, totalCareer]);

  const stackedData = useMemo(() => {
    const activeCohorts =
      cohort === null ? cohorts : cohorts.filter((k) => k === cohort);
    const fields = Object.keys(FIELD_COLORS);
    return {
      labels: activeCohorts.map((k) => `K${k}`),
      datasets: fields.map((field) => ({
        label: field,
        data: activeCohorts.map((k) => {
          const cohortAlumni = alumni.filter((u) => u.kvis_year === k);
          const withField = cohortAlumni.filter(u => primaryEducation(u)?.field_of_study);
          const total = withField.length;
          if (total === 0) return 0;
          const count = withField.filter(
            (u) => classifyFaculty(primaryEducation(u)!) === field,
          ).length;
          return (count / total) * 100;
        }),
        backgroundColor: FIELD_COLORS[field],
        borderWidth: 0,
      })),
    };
  }, [alumni, cohorts, cohort]);

  const totalAlumni = filtered.length;
  const uniqueUnis = uniRanked.length;
  const uniqueCountries = countryRanked.length;
  const cohortLabel = cohort === null ? "all cohorts" : `KVIS ${cohort}`;
  const activeColor = cohortColor(cohort ?? undefined);
  const stemPct = totalEdu > 0 ? Math.round((stemCount / totalEdu) * 100) : 0;

  const now = new Date();
  const dateline = now
    .toLocaleDateString("en-US", { month: "long", year: "numeric" })
    .toUpperCase();

  return (
    <PageEntrance>
      <div className="min-h-full bg-background">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-xl lg:py-layout">
          {/* ── Masthead ─────────────────────────────────────────────────── */}
          <FadeUp>
            <header className="pb-md border-b border-[var(--sep-strong)]">
              <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 text-[var(--kvis-green-light)] flex items-center">
                KVIS Connect <Dot className="h-6 w-6 shrink-0" aria-hidden /> Stats
              </p>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95] text-foreground">
                <span className="font-light text-foreground">By the </span>
                <span style={{ color: "var(--kvis-purple)" }}>Numbers</span>
              </h1>
              <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-[60ch] leading-relaxed">
                Where KVIS alumni went to study after graduation - the faculties
                they chose, the universities that took them in, and the
                countries they ended up in.
              </p>
              <div className="flex items-center gap-3 md:gap-4 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap mt-6 text-[var(--kvis-text3)]">
                <span>{dateline}</span>
                <Dot className="h-3 w-3 shrink-0" aria-hidden />
                <span>{alumni.length} alumni</span>
                <Dot className="h-3 w-3 shrink-0" aria-hidden />
                <span>{cohorts.length} cohorts</span>
              </div>
            </header>
          </FadeUp>

          {/* ── Cohort selector ──────────────────────────────────────────── */}
          {cohorts.length > 0 && (
            <FadeUp delay={0.1}>
              <nav
                className="grid grid-cols-[72px_1fr] md:grid-cols-[100px_1fr] items-baseline gap-x-5 gap-y-2 py-4"
                aria-label="Cohort filter"
              >
                <span className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)]">
                  Cohort
                </span>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-2.5">
                  <FilterPill
                    active={cohort === null}
                    count={alumni.length}
                    onClick={() => setCohort(null)}
                  >
                    All
                  </FilterPill>
                  {cohorts.map((y) => (
                    <FilterPill
                      key={y}
                      active={cohort === y}
                      count={cohortCounts.get(y) ?? 0}
                      onClick={() => setCohort(cohort === y ? null : y)}
                      activeColor={cohortColor(y)}
                    >
                      K{y}
                    </FilterPill>
                  ))}
                </div>
              </nav>
            </FadeUp>
          )}

          {/* ── Key figures ───────────────────────────────────────────────── */}
          <FadeUp delay={0.15}>
            <StatFigures
              items={[
                {
                  value: totalAlumni,
                  label: "Alumni",
                  sub: cohortLabel,
                  color: "var(--kvis-purple-light)",
                },
                {
                  value: uniqueUnis,
                  label: "Universities",
                  sub: cohortLabel,
                  color: "var(--kvis-green-light)",
                },
                {
                  value: `${stemPct}%`,
                  label: "In STEM",
                  sub: "of those with education data",
                  color: "var(--kvis-purple-light)",
                },
                {
                  value: uniqueCountries,
                  label: "Countries",
                  sub: "worldwide",
                  color: "var(--kvis-green-light)",
                },
              ]}
            />
          </FadeUp>

          <Separator className="bg-[var(--kvis-border)]" />

          {/* ── Loading skeleton ─────────────────────────────────────────── */}
          {isLoading ? (
            <div className="pt-10 space-y-12">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-10 w-1/2" />
                  <Skeleton className="h-4 w-1/3 mb-5" />
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="h-9 w-full" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* ── § 1: Where they went ─────────────────────────────────── */}
              <FadeUp>
                <SectionHead
                  numeral="01"
                  kicker="Geography"
                  title="Where they went"
                  lede="Countries and universities represented among registered alumni. Based on primary degree only."
                  accentColor="var(--kvis-green-light)"
                />
              </FadeUp>

              <FadeUp>
                <div className="grid md:grid-cols-2 gap-x-10 gap-y-10 pb-10">
                  {/* Countries */}
                  <div>
                    <SubHead>By country</SubHead>
                    {countryRanked.length === 0 ? (
                      <EmptyRow label="countries" />
                    ) : (
                      <RankedList
                        items={countryRanked}
                        showFlag
                        barColor="var(--kvis-purple-light)"
                      />
                    )}
                  </div>

                  {/* Universities */}
                  <div>
                    <SubHead>By university</SubHead>
                    {uniRanked.length === 0 ? (
                      <EmptyRow label="universities" />
                    ) : (
                      <RankedList
                        items={uniRanked}
                        barColor="var(--kvis-green-light)"
                      />
                    )}
                  </div>
                </div>
                <Separator className="bg-[var(--kvis-border)]" />
              </FadeUp>

              {/* ── § 2: What they studied ───────────────────────────────── */}
              <FadeUp>
                <SectionHead
                  numeral="02"
                  kicker="Fields of study"
                  title="What they studied"
                  lede="Field distribution by primary degree. STEM-classified fields are highlighted."
                  accentColor="var(--kvis-purple-light)"
                />
              </FadeUp>

              <FadeUp>
                <div className="pb-10">
                  <SubHead>By field</SubHead>
                  {facultyRanked.length === 0 ? (
                    <EmptyRow label="fields" />
                  ) : (
                    <RankedList
                      items={facultyRanked}
                      barColor="var(--kvis-purple-light)"
                    />
                  )}
                </div>
                <Separator className="bg-[var(--kvis-border)]" />
              </FadeUp>

              {/* ── § 3: Field mix per cohort ────────────────────────────── */}
              <FadeUp>
                <SectionHead
                  numeral="03"
                  kicker="Cohort breakdown"
                  title="Field mix by cohort"
                  lede="Each bar shows the proportional field distribution within a graduating class."
                  accentColor="var(--kvis-green-light)"
                />
              </FadeUp>

              <FadeUp>
                <div className="pb-10">
                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-5 gap-y-2 mb-6">
                    {Object.entries(FIELD_COLORS).map(([field, color]) => (
                      <div key={field} className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: color }}
                        />
                        <span className="text-xs text-[var(--kvis-text3)]">
                          {field}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: (cohort === null ? cohorts.length : 1) * 46,
                    }}
                  >
                    <Bar
                      data={stackedData}
                      options={{
                        indexAxis: "y" as const,
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            mode: "point" as const,
                            intersect: true,
                            callbacks: {
                              label: (ctx) => {
                                const val = ctx.parsed.x;
                                if (val === 0 || val == null)
                                  return null as any;
                                const activeCohorts =
                                  cohort === null
                                    ? cohorts
                                    : cohorts.filter((k) => k === cohort);
                                const k = activeCohorts[ctx.dataIndex];
                                const cohortAlumni = alumni.filter(
                                  (u) => u.kvis_year === k,
                                );
                                const withField = cohortAlumni.filter(
                                  (u) => primaryEducation(u)?.field_of_study,
                                );
                                const total = withField.length;
                                const count = Math.round((val / 100) * total);
                                return ` ${ctx.dataset.label}: ${val < 1 ? val.toFixed(1) : Math.round(val)}% (${count})`;
                              },
                            },
                          },
                        },
                        scales: {
                          x: {
                            stacked: true,
                            display: false,
                            beginAtZero: true,
                            min: 0,
                            max: 100,
                          },
                          y: {
                            stacked: true,
                            grid: { display: false },
                            ticks: {
                              font: { size: 12, weight: "bold" as const },
                              color: chartTickColor,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </FadeUp>
              
              {/* ── § 4: Where they work ─────────────────────────────────── */}
              <FadeUp>
                <SectionHead
                  numeral="04"
                  kicker="Career"
                  title="Where they work"
                  lede="Industry and role breakdown based on each alumnus's current or most recent position."
                  accentColor="var(--kvis-green-light)"
                />
              </FadeUp>
 
              <FadeUp>
                <div className="grid md:grid-cols-2 gap-x-10 gap-y-10 pb-10">
                  {/* Industry */}
                  <div>
                    <SubHead>By industry</SubHead>
                    {industryRanked.length === 0 ? (
                      <EmptyRow label="industries" />
                    ) : (
                      <RankedList
                        items={industryRanked}
                        barColor="var(--kvis-green-light)"
                      />
                    )}
                  </div>
 
                  {/* Role type */}
                  <div>
                    <SubHead>By role type</SubHead>
                    {roleTypeRanked.length === 0 ? (
                      <EmptyRow label="role types" />
                    ) : (
                      <RankedList
                        items={roleTypeRanked}
                        barColor="var(--kvis-purple-light)"
                      />
                    )}
                  </div>
                </div>
                <Separator className="bg-[var(--kvis-border)]" />
              </FadeUp>

              <Separator className="bg-[var(--kvis-border)]" />

              {/* Footer note */}
              <FadeUp>
                <p className="text-xs text-[var(--kvis-text3)] pt-6 pb-10 max-w-[80ch] leading-relaxed">
                  Data covers registered KVIS Connect members only and may not
                  reflect the full alumni body. Field of study is self-reported by each member.
                </p>
              </FadeUp>
            </>
          )}
        </div>
      </div>
    </PageEntrance>
  );
}
