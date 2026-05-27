"use client";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { keys } from "@/lib/cache/keys";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FilterPill } from "@/components/ui/filter-pill";
import type { UserCard, Education } from "@/lib/types";
import { PageEntrance, FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";

const ISO_MAP: Record<string, string> = {
  Thailand: "th", "United States": "us", "United States of America": "us", USA: "us", "United Kingdom": "gb", UK: "gb",
  Germany: "de", Singapore: "sg", Canada: "ca", France: "fr", Netherlands: "nl",
  Switzerland: "ch", Japan: "jp", Australia: "au", "South Korea": "kr", Sweden: "se",
  Denmark: "dk", Norway: "no", Finland: "fi", Italy: "it", Spain: "es",
  China: "cn", India: "in", Brazil: "br", Austria: "at", Belgium: "be",
  Poland: "pl", Taiwan: "tw", "Hong Kong": "hk", "New Zealand": "nz", Israel: "il",
  Ireland: "ie", Russia: "ru",
};

function FlagImg({ country, size = 20 }: { country: string; size?: number }) {
  const iso = ISO_MAP[country];
  if (!iso) {
    return (
      <span
        className="inline-block bg-muted rounded-[2px]"
        style={{ width: size * 1.4, height: size }}
      />
    );
  }
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
  if (/comput|software|robot|data scien|informat|cyber|\bai\b|artificial intel/.test(m)) return "Computing & AI";
  if (/engineer|mechan|electr|civil|chemical eng|aero|industri|materials|nuclear/.test(m)) return "Engineering";
  if (/physic|astron|geophys/.test(m)) return "Physics & Astronomy";
  if (/\bmath|statisti|actuar/.test(m)) return "Mathematics & Statistics";
  if (/biochem|chem(?!ic)/.test(m)) return "Chemistry";
  if (/biolog|biotech|microb|ecolog|zoolog|genet|neurosci/.test(m)) return "Biological Sciences";
  if (/medic|nurs|pharma|dent|public health|biomed|veterin/.test(m)) return "Medicine & Health";
  if (/econ|finance|account|business|management|marketing|\bmba\b/.test(m)) return "Business & Economics";
  if (/law|legal|jurisp/.test(m)) return "Law";
  if (/architect|industrial design|urban plann/.test(m)) return "Architecture & Design";
  if (/\barts?\b|music|film|literature|philoso|history|languag|linguist/.test(m)) return "Arts & Humanities";
  if (/psycholog|sociolog|politic|anthropo|internat|public policy/.test(m)) return "Social Sciences";
  if (/environment|earth|geolog|atmospher|ocean|climate/.test(m)) return "Earth & Environment";
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

type Row = { key: string; label: string; count: number; pct: number; rank: number };

function toRanked(map: Map<string, number>, total: number): Row[] {
  return Array.from(map, ([key, count]) => ({ key, label: key, count }))
    .sort((a, b) => b.count - a.count)
    .map((r, i) => ({
      ...r,
      pct: total > 0 ? (r.count / total) * 100 : 0,
      rank: i + 1,
    }));
}

function RankedList({ items, showFlag = false }: { items: Row[]; showFlag?: boolean }) {
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
              className="grid items-center py-3.5 border-b border-[var(--kvis-rule)]"
              style={{
                gridTemplateColumns: "1.75rem minmax(0, 1.2fr) minmax(0, 1.8fr) 2.5rem 3rem",
                columnGap: "1rem",
              }}
            >
              <span className="text-xs font-mono tabular-nums font-semibold text-[var(--kvis-text3)]">
                {String(it.rank).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                {showFlag && <FlagImg country={it.label} size={18} />}
                <span
                  className="font-semibold text-foreground truncate"
                  style={{ fontSize: 15, letterSpacing: "-0.005em" }}
                  title={it.label}
                >
                  {it.label}
                </span>
              </div>
              <div className="h-[6px] rounded-full overflow-hidden bg-[var(--kvis-rule)]">
                <div
                  className="h-full rounded-full bg-[var(--kvis-purple)]"
                  style={{
                    width: `${Math.max(it.pct, it.count > 0 ? 1.5 : 0)}%`,
                    transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)",
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
          style={{ textDecorationColor: "var(--kvis-purple)", textUnderlineOffset: 4 }}
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

function SectionHead({
  numeral,
  kicker,
  title,
  lede,
}: {
  numeral: string;
  kicker: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="pt-14 pb-6">
      <div className="flex items-baseline gap-4 mb-3">
        <span
          className="font-mono font-black text-2xl tabular-nums text-[var(--kvis-green)]"
          style={{ letterSpacing: "-0.02em" }}
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


export default function StatsClient() {
  const [cohort, setCohort] = useState<number | null>(null);

  const { data: alumni = [], isLoading } = useQuery({
    queryKey: keys.stats.alumni(),
    queryFn: () =>
      api
        .get<UserCard[]>("/api/search", {
          params: { sort: "kvis_year", order: "asc", limit: 1000 },
        })
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
      cohort === null
        ? alumni
        : alumni.filter((u) => u.kvis_year === cohort),
    [alumni, cohort],
  );

  const totalEdu = useMemo(
    () => filtered.reduce((s, u) => s + (primaryEducation(u) ? 1 : 0), 0),
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

  const totalAlumni = filtered.length;
  const uniqueUnis = uniRanked.length;
  const uniqueCountries = countryRanked.length;
  const cohortLabel = cohort === null ? "All cohorts" : `KVIS ${cohort}`;

  const now = new Date();
  const dateline = now
    .toLocaleDateString("en-US", { month: "long", year: "numeric" })
    .toUpperCase();

  return (
    <PageEntrance>
      <div className="min-h-full bg-background">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-10 lg:py-14">
          {/* Masthead */}
          <FadeUp>
            <header className="pb-7 border-b border-foreground/60">
              <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 text-[var(--kvis-purple)]">
                KVIS Connect · Stats
              </p>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95] text-foreground">
                By the Numbers
              </h1>
              <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-[60ch] leading-relaxed">
                Where KVIS alumni went to study after graduation - the faculties
                they chose, the universities that took them in, and the countries
                they ended up in.
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

          {/* Cohort selector */}
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
                    >
                      K{y}
                    </FilterPill>
                  ))}
                </div>
              </nav>
            </FadeUp>
          )}

          {/* Headline metrics */}
          <FadeUp delay={0.15}>
            <section className="grid grid-cols-3 gap-6 md:gap-10 py-9 border-b border-[var(--kvis-rule)]">
              {[
                { label: "Alumni in view", value: totalAlumni },
                { label: "Universities", value: uniqueUnis },
                { label: "Countries", value: uniqueCountries },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className={i > 0 ? "pl-6 md:pl-10 border-l border-[var(--kvis-rule)]" : ""}
                >
                  <p className="text-xs uppercase tracking-[0.24em] font-bold mb-2 text-[var(--kvis-text3)]">
                    {s.label}
                  </p>
                  <p
                    className="text-4xl md:text-5xl lg:text-6xl font-black tabular-nums text-foreground"
                    style={{ letterSpacing: "-0.04em", lineHeight: 0.95 }}
                  >
                    {s.value}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--kvis-text3)]">
                    {cohortLabel}
                  </p>
                </div>
              ))}
            </section>
          </FadeUp>

          {isLoading && (
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
          )}

          {!isLoading && (
            <>
              {/* I. Faculty */}
              <FadeUp>
                <section>
                  <SectionHead
                    numeral="I."
                    kicker="Faculty / Field of study"
                    title="What KVIS alumni study"
                    lede={
                      facultyRanked[0]
                        ? `${facultyRanked[0].label} leads with ${
                            Math.round(facultyRanked[0].pct)
                          }% of declared majors${
                            cohort ? ` in KVIS ${cohort}` : " across all cohorts"
                          } - ${facultyRanked.length} distinct fields represented in total.`
                        : undefined
                    }
                  />
                  {facultyRanked.length > 0 ? (
                    <RankedList items={facultyRanked} />
                  ) : (
                    <EmptyRow label="majors" />
                  )}
                </section>
              </FadeUp>

              {/* II. University */}
              <FadeUp>
                <section>
                  <SectionHead
                    numeral="II."
                    kicker="By institution"
                    title="Where they go to school"
                    lede={
                      uniRanked[0]
                        ? `${uniRanked[0].label} tops the list with ${
                            uniRanked[0].count
                          } ${
                            uniRanked[0].count === 1 ? "alumnus" : "alumni"
                          }. The class is spread across ${uniRanked.length} universities ${
                            cohort ? `in this cohort.` : `worldwide.`
                          }`
                        : undefined
                    }
                  />
                  {uniRanked.length > 0 ? (
                    <RankedList items={uniRanked} />
                  ) : (
                    <EmptyRow label="universities" />
                  )}
                </section>
              </FadeUp>

              {/* III. Country */}
              <FadeUp>
                <section>
                  <SectionHead
                    numeral="III."
                    kicker="By country"
                    title="Where in the world"
                    lede={(() => {
                      if (totalEdu === 0) return undefined;
                      const thai =
                        countryRanked.find((c) => c.key === "Thailand")?.count ?? 0;
                      const abroad = totalEdu - thai;
                      const pctAbroad = Math.round((abroad / totalEdu) * 100);
                      return `${pctAbroad}% of ${
                        cohort ? `KVIS ${cohort}` : "alumni"
                      } pursued their degree outside Thailand, spreading across ${
                        countryRanked.length
                      } countries around the world.`;
                    })()}
                  />
                  {countryRanked.length > 0 ? (
                    <RankedList items={countryRanked} showFlag />
                  ) : (
                    <EmptyRow label="destinations" />
                  )}
                </section>
              </FadeUp>

              <FadeUp>
                <footer className="mt-20 pt-6 border-t border-foreground/60 text-muted-foreground text-xs uppercase tracking-[0.22em] flex items-center justify-between flex-wrap gap-2">
                  <span>
                    - Based on {alumni.length} alumni profiles · {cohortLabel} -
                  </span>
                  <span className="tabular-nums">
                    Updated {now.getFullYear()}
                  </span>
                </footer>
              </FadeUp>
            </>
          )}
        </div>
      </div>
    </PageEntrance>
  );
}
