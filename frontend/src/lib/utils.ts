import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fullName(user: { first_name: string; last_name: string }) {
  return `${user.first_name} ${user.last_name}`.trim();
}

export function genLabel(year: number) {
  return `K${year}`;
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

const COHORT_BASE: { l: string; c: string; text: string }[] = [
  ...COHORT_HUES.map(() => ({ l: '62%', c: '0.18', text: 'white' })),
  ...COHORT_HUES.map(() => ({ l: '82%', c: '0.11', text: '#555' })),
];

function getCohortEraGroupSize(latestCohort: number): number {
  if (latestCohort <= 20) return 1;
  if (latestCohort <= 40) return 2;
  return 3;
}

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

const COHORT_HEX: string[] = [
  "#e05a3a", // red-orange (10°)
  "#d4922a", // amber (45°)
  "#7aaa2a", // yellow-lime (80°)
  "#2a9e5a", // green (130°)
  "#2a9e8a", // teal (170°)
  "#2a8eaa", // cyan (190°)
  "#2a6eaa", // sky (210°)
  "#3a4ecc", // blue (250°)
  "#6a3acc", // indigo (280°)
  "#aa3a8a", // pink-purple (310°)
];

const COHORT_HEX_SOFT: string[] = [
  "#fae8e4", "#faf0e4", "#f0f5e0", "#e0f5ec",
  "#e0f5f2", "#e0f2f5", "#e0ecf5", "#e8e8fa",
  "#f0e8fa", "#f5e0f2",
];

export function cohortColorHex(kvis_year: number | null | undefined): string {
  if (!kvis_year) return "#6d28d9";
  const g = getCohortEraGroupSize(LATEST_COHORT);
  const idx = Math.floor((kvis_year - 1) / g) % 10;
  return COHORT_HEX[idx];
}

export function cohortColorSoftHex(kvis_year: number | null | undefined): string {
  if (!kvis_year) return "#ede9fe";
  const g = getCohortEraGroupSize(LATEST_COHORT);
  const idx = Math.floor((kvis_year - 1) / g) % 10;
  return COHORT_HEX_SOFT[idx];
}

export function effectiveKvisYear(user: { kvis_year?: number | null; current_grade?: number | null }): number | null {
  if (user.kvis_year) return user.kvis_year;
  if (user.current_grade === 12) return LATEST_COHORT + 1;
  if (user.current_grade === 11) return LATEST_COHORT + 2;
  if (user.current_grade === 10) return LATEST_COHORT + 3;
  return null;
}

// ─── Faculty color ───────────────────────────────────────────────────────────
// Gold hue (85°) — not used by any of the 10 cohort hues (10,45,80,130,…,310).
// 80° is close but distinct; 85° reads as warm gold, evokes "professor".
export const FACULTY_COLOR         = "oklch(62% 0.16 82)";
export const FACULTY_COLOR_HEX     = "#B8941F";
export const FACULTY_COLOR_SOFT_HEX = "#FBF3D9";
export const FACULTY_TEXT_COLOR    = "white";

/** Returns true for any user who has faculty fields set. */
export function isFaculty(u: {
  teach_start_year?: number | null;
  is_current_teacher?: boolean | null;
}): boolean {
  return !!(u.teach_start_year || u.is_current_teacher);
}

/**
 * "2018–present" or "2018–2024" or just "KVIS Faculty"
 */
export function facultyPeriodLabel(u: {
  teach_start_year?: number | null;
  teach_end_year?: number | null;
  is_current_teacher?: boolean | null;
}): string {
  if (!u.teach_start_year) return "KVIS Faculty";
  const end = u.is_current_teacher
    ? "present"
    : (u.teach_end_year ? String(u.teach_end_year) : "present");
  return `${u.teach_start_year}–${end}`;
}