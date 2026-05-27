import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fullName(user: { first_name: string; last_name: string }) {
  return `${user.first_name} ${user.last_name}`.trim();
}

export function genLabel(year: number) {
  if (year <= 9) return `K${year}`;
  const base = 2018;
  return `Gen ${year - base + 1}`;
}

export function kvisYearLabel(year: number) {
  return `${year} (${genLabel(year)})`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

const COHORT_HUES = [10, 45, 80, 130, 170, 190, 210, 250, 280, 310];
const COHORT_NAMES = ['red-orange','amber','yellow-lime','green','teal','cyan','sky','blue','indigo','pink-purple'];

const COHORT_BASE: { l: string; c: string; text: string }[] = [
  ...COHORT_HUES.map(() => ({ l: '62%', c: '0.18', text: 'white' })),
  ...COHORT_HUES.map(() => ({ l: '82%', c: '0.11', text: '#555' })),
];

function getCohortEraGroupSize(latestCohort: number): number {
  if (latestCohort <= 20) return 1;
  if (latestCohort <= 40) return 2;
  return 3;
}

// Pass the latest known cohort so grouping is retroactive.
// For now we hardcode 9 as the latest — update when new cohorts graduate.
const LATEST_COHORT = 9;

export function cohortColor(kvis_year: number | null | undefined): string {
  if (!kvis_year) return 'var(--kvis-purple)';
  const g = getCohortEraGroupSize(LATEST_COHORT);
  const idx = Math.floor((kvis_year - 1) / g) % 20;
  const hue = COHORT_HUES[idx % COHORT_HUES.length];
  const { l, c } = COHORT_BASE[idx];
  return `oklch(${l} ${c} ${hue})`;
}

export function cohortColorSoft(kvis_year: number | null | undefined): string {
  if (!kvis_year) return 'var(--kvis-purple-soft)';
  const g = getCohortEraGroupSize(LATEST_COHORT);
  const idx = Math.floor((kvis_year - 1) / g) % 20;
  const hue = COHORT_HUES[idx % COHORT_HUES.length];
  return `oklch(95% 0.025 ${hue})`;
}

export function cohortTextColor(kvis_year: number | null | undefined): string {
  if (!kvis_year) return 'white';
  const g = getCohortEraGroupSize(LATEST_COHORT);
  const idx = Math.floor((kvis_year - 1) / g) % 20;
  return COHORT_BASE[idx].text;
}