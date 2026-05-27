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
