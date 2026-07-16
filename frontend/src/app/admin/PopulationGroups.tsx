"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, GraduationCap, Users } from "lucide-react";
import { summaryApi } from "@/lib/api";
import type { Summary } from "@/lib/types";
import { LOCAL_EXPORT_SNAPSHOT } from "./populationSnapshot";

type PopulationGroupsProps = { className?: string };
type PopulationGroup = {
  key: string;
  label: string;
  category: string;
  isCurrentStudent: boolean;
  count: number;
};

const CURRENT_GRADE_TO_KVIS = [
  { grade: "12", kvis: "10" },
  { grade: "11", kvis: "11" },
  { grade: "10", kvis: "12" },
] as const;

export function PopulationGroups({ className = "" }: PopulationGroupsProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState(false);
  const useLocalSnapshot = process.env.NEXT_PUBLIC_POPULATION_SNAPSHOT === "production-export";

  useEffect(() => {
    if (useLocalSnapshot) return;
    summaryApi.getSummary().then(setSummary).catch(() => setError(true));
  }, [useLocalSnapshot]);

  const groups = useMemo<PopulationGroup[]>(() => {
    const cohortSource = useLocalSnapshot
      ? LOCAL_EXPORT_SNAPSHOT.alumniByCohort
      : summary?.by_kvis_year ?? {};
    const cohortGroups: PopulationGroup[] = Object.entries(cohortSource)
      .map<PopulationGroup>(([cohort, count]) => ({
        key: `cohort-${cohort}`,
        label: `KVIS ${cohort}`,
        category: "Alumni cohort",
        isCurrentStudent: false,
        count,
      }))
      .sort((a, b) => Number(a.label.replace("KVIS ", "")) - Number(b.label.replace("KVIS ", "")));

    if (!useLocalSnapshot) return cohortGroups;

    const currentStudentGroups: PopulationGroup[] = CURRENT_GRADE_TO_KVIS.map(({ grade, kvis }) => ({
      key: `grade-${grade}`,
      label: `KVIS ${kvis}`,
      category: `Current students / Grade ${grade}`,
      isCurrentStudent: true,
      count: LOCAL_EXPORT_SNAPSHOT.currentGrades[grade],
    }));

    return [...cohortGroups, ...currentStudentGroups];
  }, [summary, useLocalSnapshot]);
  const maximum = Math.max(...groups.map((group) => group.count), 1);

  return (
    <section aria-labelledby="population-groups-title" className={`border border-[#17251d]/15 bg-[#faf8f3] ${className}`}>
      <div className="flex flex-col gap-4 border-b border-[#17251d]/10 p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div>
          <div className="flex items-center gap-2 text-[#52714f]"><BarChart3 className="h-4 w-4" aria-hidden="true" /><p className="text-[10px] font-bold uppercase tracking-[0.22em]">Population groups</p></div>
          <h2 id="population-groups-title" className="mt-2 font-display text-3xl font-black tracking-[-0.04em]">Members by KVIS generation.</h2>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-[#657064]">
            {useLocalSnapshot ? "Current Grade 12 is KVIS 10, Grade 11 is KVIS 11, and Grade 10 is KVIS 12. No personal records are loaded into this page." : "Registered alumni records grouped by their recorded KVIS generation."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-xs text-[#35503b]">
          <div className="inline-flex items-center gap-2 border border-[#17251d]/15 bg-[#f0ede5] px-3 py-2"><Users className="h-3.5 w-3.5" aria-hidden="true" />{useLocalSnapshot ? `${LOCAL_EXPORT_SNAPSHOT.total.toLocaleString()} total records` : summary ? `${summary.total.toLocaleString()} total records` : "Loading groups"}</div>
          {useLocalSnapshot && <div className="inline-flex items-center gap-2 border border-[#52714f]/25 bg-[#e7edda] px-3 py-2 font-semibold text-[#31583c]"><GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />{LOCAL_EXPORT_SNAPSHOT.currentStudentCount.toLocaleString()} current students</div>}
        </div>
      </div>
      {useLocalSnapshot && (
        <div className="grid divide-y divide-[#17251d]/10 border-b border-[#17251d]/10 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <SnapshotMetric label="Alumni" value={LOCAL_EXPORT_SNAPSHOT.alumniCount} />
          <SnapshotMetric label="Current students" value={LOCAL_EXPORT_SNAPSHOT.currentStudentCount} />
          <SnapshotMetric label="Teacher / staff" value={LOCAL_EXPORT_SNAPSHOT.teacherStaffCount} />
          <SnapshotMetric label="All records" value={LOCAL_EXPORT_SNAPSHOT.total} />
        </div>
      )}
      {error ? <p className="p-6 text-sm text-[#b42318]">Grouping data is unavailable right now.</p> : groups.length === 0 ? <p className="p-6 text-sm text-[#657064]">Loading grouping data...</p> : (
        <div className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2 md:grid-cols-3 md:p-6 lg:grid-cols-4">
          {groups.map(({ key, label, category, isCurrentStudent, count }) => (
            <div key={key}>
              <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                  <span className="block font-mono text-xs uppercase tracking-[0.14em] text-[#657064]">{label}</span>
                  <span className={`mt-1 block text-[9px] font-bold uppercase tracking-[0.16em] ${isCurrentStudent ? "text-[#31583c]" : "text-[#8b9487]"}`}>{category}</span>
                </div>
                <span className="font-display text-xl font-black tabular-nums text-[#17251d]">{count}</span>
              </div>
              <div className="h-2 bg-[#e8e5dc]" aria-hidden="true">
                <div
                  className={`h-full transition-[width] duration-500 ${isCurrentStudent ? "bg-[#91bd58]" : "bg-[#52714f]"}`}
                  style={{ width: count === 0 ? "0%" : `${Math.max((count / maximum) * 100, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SnapshotMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-5 py-4 md:px-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#657064]">{label}</p>
      <p className="mt-1 font-display text-2xl font-black tabular-nums text-[#17251d]">{value}</p>
    </div>
  );
}
