"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Palette, RotateCcw, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { dispatchSiteTheme } from "@/components/SiteThemeLoader";
import { useAuth } from "@/contexts/AuthContext";
import { siteThemeApi } from "@/lib/api";
import type { SiteThemeColors } from "@/lib/types";

const THEME_PERMISSION = "admin.site_theme.manage";

const DEFAULT_COLORS: SiteThemeColors = {
  background: "#f8f7f3",
  surface: "#ece9e1",
  foreground: "#17251d",
  primary: "#6d28d9",
  accent: "#9d7cea",
  green: "#3f7047",
  border: "#d4d0c7",
  danger: "#b42318",
};

const COLOR_FIELDS: Array<{ key: keyof SiteThemeColors; label: string; description: string }> = [
  { key: "background", label: "Background", description: "Main page canvas" },
  { key: "surface", label: "Surface", description: "Cards and soft controls" },
  { key: "foreground", label: "Text", description: "Main readable text" },
  { key: "primary", label: "Primary", description: "Primary actions and links" },
  { key: "accent", label: "Accent", description: "Highlights and decorative color" },
  { key: "green", label: "Green", description: "Success and KVIS green details" },
  { key: "border", label: "Border", description: "Rules, inputs, and dividers" },
  { key: "danger", label: "Danger", description: "Errors and destructive actions" },
];

const CONTRAST_PAIRS: Array<{
  first: keyof SiteThemeColors;
  second: keyof SiteThemeColors;
  label: string;
}> = [
  { first: "foreground", second: "background", label: "Main text on the page canvas" },
  { first: "foreground", second: "surface", label: "Main text on cards and controls" },
  { first: "primary", second: "background", label: "Primary links on the page canvas" },
  { first: "green", second: "background", label: "Green labels on the page canvas" },
];

type ContrastWarning = { label: string; ratio: number };

function relativeLuminance(hex: string): number | null {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrastRatio(first: string, second: string): number | null {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  if (firstLuminance === null || secondLuminance === null) return null;
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function getContrastWarnings(colors: SiteThemeColors): Partial<Record<keyof SiteThemeColors, ContrastWarning[]>> {
  const warnings: Partial<Record<keyof SiteThemeColors, ContrastWarning[]>> = {};
  for (const pair of CONTRAST_PAIRS) {
    const ratio = contrastRatio(colors[pair.first], colors[pair.second]);
    if (ratio === null || ratio >= 4.5) continue;
    for (const key of [pair.first, pair.second]) {
      (warnings[key] ??= []).push({ label: pair.label, ratio });
    }
  }
  return warnings;
}

function hasCompleteTheme(colors: Partial<SiteThemeColors>): colors is SiteThemeColors {
  return COLOR_FIELDS.every(({ key }) => /^#[0-9a-f]{6}$/i.test(colors[key] ?? ""));
}

export default function ThemeControlPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [colors, setColors] = useState<SiteThemeColors>(DEFAULT_COLORS);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "saved" | "error">("loading");
  const [message, setMessage] = useState("");
  const contrastWarnings = getContrastWarnings(colors);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login?next=/admin/theme");
      return;
    }
    if (!user.permissions.includes(THEME_PERMISSION)) {
      setStatus("error");
      setMessage("Your account does not have permission to manage the site theme.");
      return;
    }
    siteThemeApi.get()
      .then((theme) => {
        // Keep the controls, preview, and current browser canvas on one palette.
        const nextColors = hasCompleteTheme(theme.colors) ? theme.colors : DEFAULT_COLORS;
        setColors(nextColors);
        dispatchSiteTheme(nextColors);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
        setMessage("The saved theme could not be loaded.");
      });
  }, [loading, router, user]);

  function updateColor(key: keyof SiteThemeColors, value: string) {
    const next = { ...colors, [key]: value };
    setColors(next);
    if (/^#[0-9a-f]{6}$/i.test(value)) dispatchSiteTheme(next);
  }

  async function saveTheme() {
    setStatus("saving");
    setMessage("");
    try {
      const theme = await siteThemeApi.update(colors);
      dispatchSiteTheme(theme.colors);
      setStatus("saved");
      setMessage("Site-wide theme saved.");
    } catch {
      setStatus("error");
      setMessage("The theme could not be saved. Check your permission and try again.");
    }
  }

  async function resetTheme() {
    setStatus("saving");
    setMessage("");
    try {
      await siteThemeApi.reset();
      dispatchSiteTheme({});
      setColors(DEFAULT_COLORS);
      setStatus("ready");
      setMessage("Saved theme removed. The built-in site colors are active again.");
    } catch {
      setStatus("error");
      setMessage("The theme could not be reset. Check your permission and try again.");
    }
  }

  if (loading || status === "loading") {
    return <div className="min-h-screen bg-[var(--admin-canvas)] p-8 text-sm text-[#657064]">Loading theme control...</div>;
  }

  if (!user || !user.permissions.includes(THEME_PERMISSION)) {
    return <div className="min-h-screen bg-[var(--admin-canvas)] p-8 text-sm text-[#b42318]">{message || "Theme control is restricted."}</div>;
  }

  return (
    <main className="admin-light-surface min-h-screen bg-[var(--admin-canvas)] px-4 py-8 text-[#17251d] transition-colors duration-200 md:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 border-b border-[#17251d]/15 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#52714f]">Administration / Site theme</p>
            <h1 className="mt-3 font-display text-5xl font-black tracking-[-0.05em]">Shape the public palette.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#657064]">These colors apply across the public KVIS Connect site after saving. Only validated hex colors can be stored, and every update records the administrator and time.</p>
          </div>
          <Button asChild variant="outline" className="border-[#17251d]/20 bg-transparent text-[#17251d] hover:bg-[#e8e5dc]"><Link href="/admin">Back to dashboard</Link></Button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.78fr]">
          <section className="border border-[#17251d]/15 bg-[#faf8f3] p-5 md:p-6">
            <div className="flex items-center gap-2 text-[#52714f]"><Palette className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[0.22em]">Color controls</span></div>
            <p className="mt-3 text-xs leading-relaxed text-[#657064]">Contrast is checked live against the WCAG AA minimum of 4.5:1 for normal text. Warnings are advisory and do not prevent saving.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {COLOR_FIELDS.map(({ key, label, description }) => (
                <label key={key} className="border border-[#17251d]/15 bg-white p-4">
                  <span className="block text-xs font-bold uppercase tracking-[0.16em] text-[#35503b]">{label}</span>
                  <span className="mt-1 block text-xs text-[#657064]">{description}</span>
                  <span className="mt-4 flex items-center gap-3">
                    <input aria-label={`${label} color`} type="color" value={colors[key]} onChange={(event) => updateColor(key, event.target.value)} className="h-10 w-12 cursor-pointer border border-[#17251d]/15 bg-white p-1" />
                    <input value={colors[key]} onChange={(event) => updateColor(key, event.target.value)} maxLength={7} className="h-10 min-w-0 flex-1 border border-[#17251d]/15 px-3 font-mono text-sm uppercase outline-none focus:border-[#52714f]" />
                  </span>
                  {contrastWarnings[key]?.map((warning) => (
                    <span key={warning.label} role="alert" className="mt-3 block border border-[#d92d20] bg-[#fff1f0] px-3 py-2 text-xs font-bold leading-relaxed text-[#d92d20]">
                      Warning: Contrast is too low for readability ({warning.ratio.toFixed(2)}:1). {warning.label} requires at least 4.5:1.
                    </span>
                  ))}
                </label>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={saveTheme} disabled={status === "saving"} className="rounded-none bg-[#173b2b] text-white hover:bg-[#28513d]"><Check className="mr-2 h-4 w-4" />Save site theme</Button>
              <Button onClick={resetTheme} disabled={status === "saving"} variant="outline" className="rounded-none border-[#17251d]/20 bg-transparent text-[#17251d] hover:bg-[#e8e5dc]"><RotateCcw className="mr-2 h-4 w-4" />Reset to built-in</Button>
            </div>
            {message && <p className={`mt-4 text-sm ${status === "error" ? "text-[#b42318]" : "text-[#35503b]"}`}>{message}</p>}
          </section>

          <aside className="border border-[#17251d]/15 bg-[#dce7cf] p-5 md:p-6">
            <div className="flex items-center gap-2 text-[#31583c]"><ShieldCheck className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[0.22em]">Live preview</span></div>
            <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.04em]">Preview before saving.</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#35503b]">Changing a value previews it in this browser immediately. It does not affect other visitors until you select Save site theme.</p>
            <div className="mt-8 overflow-hidden border border-[#17251d]/20 bg-background text-[hsl(var(--foreground))]">
              <div className="bg-[hsl(var(--primary))] px-4 py-3 text-[hsl(var(--primary-foreground))]">KVIS Connect</div>
              <div className="p-4"><p className="font-display text-2xl font-black">A connected community.</p><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Cards, navigation, and actions use your saved semantic colors.</p><button type="button" className="mt-4 bg-[hsl(var(--primary))] px-3 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))]">Sample action</button></div>
            </div>
          </aside>
        </div>

        <section className="mt-6 border border-[#17251d]/15 bg-[#faf8f3] p-5 md:p-6">
          <div className="flex items-center gap-2 text-[#52714f]"><Palette className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[0.22em]">About page preview</span></div>
          <p className="mt-2 text-sm text-[#657064]">A compact preview of the public About page, including its headline, statistics, dividers, and long-form content.</p>
          <div className="mt-6 overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
            <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--kvis-green)]">KVIS Connect / About</p>
              <h2 className="mt-4 font-display text-4xl font-black tracking-[-0.05em] md:text-5xl"><span className="font-light">About </span><span className="text-[var(--kvis-purple)]">Us</span></h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">KVIS Connect maps the global footprint of Kamnoetvidya Science Academy graduates - who&apos;s where, what they&apos;re building, and how the network keeps growing long after graduation.</p>
              <div className="mt-8 grid grid-cols-2 border-y border-[hsl(var(--border))] sm:grid-cols-4">
                <AboutStat value="2014" label="Year founded" className="text-[var(--kvis-green)]" />
                <AboutStat value="72" label="Students per cohort" className="text-[var(--kvis-purple)]" />
                <AboutStat value="100%" label="Scholarship coverage" className="text-[var(--kvis-green)]" />
                <AboutStat value="600+" label="Alumni worldwide" className="text-[var(--kvis-purple)]" />
              </div>
              <div className="mt-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--kvis-green)]">The school</p>
                <h3 className="mt-4 font-display text-2xl font-black">Kamnoetvidya Science Academy</h3>
                <p className="mt-4 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">Founded in 2014, KVIS is a private boarding high school for students with strong aptitude in mathematics and science. This preview lets you confirm that long-form public content remains readable with your selected colors.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AboutStat({ value, label, className }: { value: string; label: string; className: string }) {
  return (
    <div className="border-b border-r border-[hsl(var(--border))] px-4 py-5 last:border-r-0 sm:border-b-0">
      <p className={`font-display text-2xl font-black ${className}`}>{value}</p>
      <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{label}</p>
    </div>
  );
}
