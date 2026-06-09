import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LATEST_COHORT } from "@/lib/constants/options";
import type { GlobePin } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hasValidGlobeCoords(
  pin: GlobePin,
): pin is GlobePin & { latitude: number; longitude: number } {
  return (
    pin.latitude != null &&
    pin.longitude != null &&
    Number.isFinite(pin.latitude) &&
    Number.isFinite(pin.longitude)
  );
}

export function filterGlobePins(pins: GlobePin[]): GlobePin[] {
  return pins.filter(hasValidGlobeCoords);
}

export function fullName(user: { first_name: string; last_name: string }) {
  return `${user.first_name} ${user.last_name}`.trim();
}

export function genLabel(year: number) {
  return `K${year}`;
}

export function cohortLabel(year: number) {
  return `KVIS ${year}`;
}

export function kvisYearLabel(year: number) {
  return `${year} (${genLabel(year)})`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

const PURPLE_SHADES = [
  { color: 'var(--cohort-p1)', hex: '#6d28d9', soft: '#ede9fe' },
  { color: 'var(--cohort-p2)', hex: '#7c3aed', soft: '#f0ebff' },
  { color: 'var(--cohort-p3)', hex: '#8b5cf6', soft: '#f3f0ff' },
  { color: 'var(--cohort-p4)', hex: '#5b21b6', soft: '#ede9fe' },
];

const GREEN_SHADES = [
  { color: 'var(--cohort-g1)', hex: '#15803d', soft: '#dcfce7' },
  { color: 'var(--cohort-g2)', hex: '#16a34a', soft: '#dcfce7' },
  { color: 'var(--cohort-g3)', hex: '#166534', soft: '#f0fdf4' },
  { color: 'var(--cohort-g4)', hex: '#15803d', soft: '#f0fdf4' },
];

function cohortShade(kvis_year: number) {
  if (kvis_year % 2 === 0) {
    return GREEN_SHADES[Math.floor((kvis_year - 2) / 2) % GREEN_SHADES.length];
  }
  return PURPLE_SHADES[Math.floor((kvis_year - 1) / 2) % PURPLE_SHADES.length];
}

export function cohortColor(kvis_year: number | null | undefined): string {
  if (!kvis_year) return 'var(--kvis-purple)';
  return cohortShade(kvis_year).color;
}

export function cohortColorSoft(kvis_year: number | null | undefined): string {
  if (!kvis_year) return 'var(--kvis-purple-soft)';
  return cohortShade(kvis_year).soft;
}

export function cohortTextColor(_kvis_year: number | null | undefined): string {
  return 'white';
}

export function cohortColorHex(kvis_year: number | null | undefined): string {
  if (!kvis_year) return '#6d28d9';
  return cohortShade(kvis_year).hex;
}

export function cohortColorSoftHex(kvis_year: number | null | undefined): string {
  if (!kvis_year) return '#ede9fe';
  return cohortShade(kvis_year).soft;
}

export function effectiveKvisYear(user: { kvis_year?: number | null; current_grade?: number | null }): number | null {
  if (user.kvis_year) return user.kvis_year;
  if (user.current_grade === 12) return LATEST_COHORT + 1;
  if (user.current_grade === 11) return LATEST_COHORT + 2;
  if (user.current_grade === 10) return LATEST_COHORT + 3;
  return null;
}

// ─── Faculty color ────────────────────────────────────────────────────────────
export const FACULTY_COLOR          = "oklch(62% 0.16 82)";
export const FACULTY_COLOR_HEX      = "#B8941F";
export const FACULTY_COLOR_SOFT_HEX = "#FBF3D9";
export const FACULTY_TEXT_COLOR     = "white";

export function isFaculty(u: {
  teach_start_year?: number | null;
  is_current_teacher?: boolean | null;
}): boolean {
  return !!(u.teach_start_year || u.is_current_teacher);
}

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