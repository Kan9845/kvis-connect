"use client";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
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
import type { UserCard, Education } from "@/lib/types";
import {
  PageEntrance,
  FadeUp,
  StaggerList,
  StaggerItem,
} from "@/components/ui/motion";
import { cohortColor } from "@/lib/utils";

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
  Engineering: "#5b8dee",
  "Computing & AI": "#7c6fcd",
  "Medicine & Health": "#e06b8b",
  "Biological Sciences": "#4caf86",
  "Physics & Astronomy": "#e8a838",
  Chemistry: "#e0724a",
  "Mathematics & Statistics": "#8bb8a8",
  "Business & Economics": "#c49a3c",
  "Earth & Environment": "#6bab6b",
  Law: "#a0896b",
  "Architecture & Design": "#b07ab0",
  "Arts & Humanities": "#7a9ab0",
  "Social Sciences": "#8faa7a",
  "Other Fields": "#aaa",
};

const STEM_FIELDS = new Set([
  "Engineering",
  "Computing & AI",
  "Medicine & Health",
  "Biological Sciences",
  "Physics & Astronomy",
  "Chemistry",
  "Mathematics & Statistics",
  "Earth & Environment",
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

function classifyFaculty(major: string): string {
  const m = major.toLowerCase();
  if (
    /comput|software|robot|data scien|informat|cyber|\bai\b|artificial intel/.test(
      m,
    )
  )
    return "Computing & AI";
  if (
    /engineer|mechan|electr|civil|chemical eng|aero|industri|materials|nuclear/.test(
      m,
    )
  )
    return "Engineering";
  if (/physic|astron|geophys/.test(m)) return "Physics & Astronomy";
  if (/\bmath|statisti|actuar/.test(m)) return "Mathematics & Statistics";
  if (/biochem|chem(?!ic)/.test(m)) return "Chemistry";
  if (/biolog|biotech|microb|ecolog|zoolog|genet|neurosci/.test(m))
    return "Biological Sciences";
  if (/medic|nurs|pharma|dent|public health|biomed|veterin/.test(m))
    return "Medicine & Health";
  if (/econ|finance|account|business|management|marketing|\bmba\b/.test(m))
    return "Business & Economics";
  if (/law|legal|jurisp/.test(m)) return "Law";
  if (/architect|industrial design|urban plann/.test(m))
    return "Architecture & Design";
  if (
    /\barts?\b|music|film|literature|philoso|history|languag|linguist/.test(m)
  )
    return "Arts & Humanities";
  if (/psycholog|sociolog|politic|anthropo|internat|public policy/.test(m))
    return "Social Sciences";
  if (/environment|earth|geolog|atmospher|ocean|climate/.test(m))
    return "Earth & Environment";
  return "Other Fields";
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
            className="font-display font-black tabular-nums leading-none"
            style={{
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
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
  barColor = "var(--kvis-purple)",
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
                  className="font-semibold text-foreground truncate text-sm"
                  style={{ letterSpacing: "-0.005em" }}
                  title={it.label}
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
          className="mt-5 h-auto p-0 text-xs font-bold uppercase tracking-[0.22em] no-underline hover:underline text-[var(--kvis-purple)]"
          style={{
            textDecorationColor: "var(--kvis-purple)",
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
  accentColor = "var(--kvis-green)",
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
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-[-0.025em] leading-[1.02] text-foreground">
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
    <div className="flex items-center gap-3 pb-3 border-b border-foreground/20 mb-1">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-foreground">
        {children}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StatsClient() {
  const [cohort, setCohort] = useState<number | null>(null);

  const { data: alumni = [], isLoading } = useQuery({
    queryKey: keys.stats.alumni(),
    queryFn: () =>
      api
        .get<
          UserCard[]
        >("/api/search", { params: { sort: "kvis_year", order: "asc", limit: 1000 } })
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

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

  const stemCount = useMemo(
    () =>
      filtered.reduce((s, u) => {
        const e = primaryEducation(u);
        if (!e?.major) return s;
        return STEM_FIELDS.has(classifyFaculty(e.major)) ? s + 1 : s;
      }, 0),
    [filtered],
  );

  const facultyRanked = useMemo(() => {
    const c = new Map<string, number>();
    filtered.forEach((u) => {
      const e = primaryEducation(u);
      if (!e?.major) return;
      const f = classifyFaculty(e.major);
      c.set(f, (c.get(f) ?? 0) + 1);
    });
    return toRanked(c, totalEdu);
  }, [filtered, totalEdu]);

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
      const country = e?.country ?? u.country;
      if (!country) return;
      c.set(country, (c.get(country) ?? 0) + 1);
    });
    return toRanked(c, totalEdu);
  }, [filtered, totalEdu]);

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
          const withMajor = cohortAlumni.filter(
            (u) => primaryEducation(u)?.major,
          );
          const total = withMajor.length;
          if (total === 0) return 0;
          const count = withMajor.filter(
            (u) => classifyFaculty(primaryEducation(u)!.major!) === field,
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
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-10 lg:py-14">
          {/* ── Masthead ─────────────────────────────────────────────────── */}
          <FadeUp>
            <header className="pb-7 border-b border-foreground/60">
              <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 text-[var(--kvis-green-light)]">
                KVIS Connect · Stats
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
                <span aria-hidden>·</span>
                <span>{alumni.length} alumni</span>
                <span aria-hidden>·</span>
                <span>{cohorts.length} cohorts</span>
              </div>
            </header>
          </FadeUp>

          {/* ── Cohort selector ──────────────────────────────────────────── */}
          {cohorts.length > 0 && (
            <FadeUp delay={0.1}>
              <nav
                className="grid grid-cols-[72px_1fr] md:grid-cols-[100px_1fr] items-baseline gap-x-5 gap-y-2 py-4 border-b border-[var(--kvis-rule)]"
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
                  color: activeColor,
                },
                {
                  value: uniqueUnis,
                  label: "Universities",
                  sub: cohortLabel,
                  color: "var(--kvis-purple-light)",
                },
                {
                  value: `${stemPct}%`,
                  label: "In STEM",
                  sub: "of those with education data",
                  color: "var(--kvis-green)",
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
                  accentColor="var(--kvis-green)"
                />
              </FadeUp>

              <FadeUp>
                <div className="grid md:grid-cols-2 gap-x-10 gap-y-10 border-b border-[var(--kvis-rule)] pb-10">
                  {/* Countries */}
                  <div>
                    <SubHead>By country</SubHead>
                    {countryRanked.length === 0 ? (
                      <EmptyRow label="countries" />
                    ) : (
                      <RankedList
                        items={countryRanked}
                        showFlag
                        barColor={activeColor}
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
                        barColor="var(--kvis-purple-light)"
                      />
                    )}
                  </div>
                </div>
              </FadeUp>

              {/* ── § 2: What they studied ───────────────────────────────── */}
              <FadeUp>
                <SectionHead
                  numeral="02"
                  kicker="Fields of study"
                  title="What they studied"
                  lede="Field distribution by primary degree. STEM-classified fields are highlighted."
                  accentColor="var(--kvis-purple)"
                />
              </FadeUp>

              <FadeUp>
                <div className="pb-10 border-b border-[var(--kvis-rule)]">
                  <SubHead>By field</SubHead>
                  {facultyRanked.length === 0 ? (
                    <EmptyRow label="fields" />
                  ) : (
                    <RankedList
                      items={facultyRanked}
                      barColor="var(--kvis-purple)"
                    />
                  )}
                </div>
              </FadeUp>

              {/* ── § 3: Field mix per cohort ────────────────────────────── */}
              <FadeUp>
                <SectionHead
                  numeral="03"
                  kicker="Cohort breakdown"
                  title="Field mix by cohort"
                  lede="Each bar shows the proportional field distribution within a graduating class."
                  accentColor="var(--kvis-purple-light)"
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
                                const withMajor = cohortAlumni.filter(
                                  (u) => primaryEducation(u)?.major,
                                );
                                const total = withMajor.length;
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
                              color: "oklch(60% 0.006 294)",
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </FadeUp>

              {/* Footer note */}
              <FadeUp>
                <p className="text-xs text-[var(--kvis-text3)] border-t border-[var(--kvis-rule)] pt-6 pb-10 max-w-[65ch] leading-relaxed">
                  Data covers registered KVIS Connect members only and may not
                  reflect the full alumni body. Field classification is based on
                  major name matching and may contain minor inaccuracies.
                </p>
              </FadeUp>
            </>
          )}
        </div>
      </div>
    </PageEntrance>
  );
}
