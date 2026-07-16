"use client";

import { useEffect } from "react";
import { siteThemeApi } from "@/lib/api";
import type { SiteThemeColors } from "@/lib/types";

const CSS_PROPERTIES = [
  "--background", "--foreground", "--card", "--card-foreground", "--popover", "--popover-foreground",
  "--primary", "--primary-foreground", "--secondary", "--secondary-foreground", "--muted",
  "--muted-foreground", "--accent", "--accent-foreground", "--destructive", "--destructive-foreground",
  "--border", "--input", "--ring", "--kvis-purple", "--kvis-purple-light", "--kvis-purple-soft",
  "--kvis-green", "--kvis-green-light", "--kvis-border", "--kvis-rule", "--admin-canvas",
];

function hexToHsl(hex: string) {
  const value = hex.slice(1);
  const red = parseInt(value.slice(0, 2), 16) / 255;
  const green = parseInt(value.slice(2, 4), 16) / 255;
  const blue = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }
  return `${Math.round((hue + 360) % 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

function readableText(hex: string) {
  const value = hex.slice(1);
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 160 ? "0 0% 8%" : "0 0% 100%";
}

function softColor(hex: string) {
  const value = hex.slice(1);
  return `rgb(${parseInt(value.slice(0, 2), 16)} ${parseInt(value.slice(2, 4), 16)} ${parseInt(value.slice(4, 6), 16)} / 0.12)`;
}

export function applySiteTheme(colors: Partial<SiteThemeColors>) {
  const root = document.documentElement;
  CSS_PROPERTIES.forEach((property) => root.style.removeProperty(property));
  if (Object.keys(colors).length === 0) return;

  const setHsl = (property: string, color?: string) => color && root.style.setProperty(property, hexToHsl(color));
  const setRaw = (property: string, color?: string) => color && root.style.setProperty(property, color);
  const { background, surface, foreground, primary, accent, green, border, danger } = colors;

  ["--background", "--card", "--popover"].forEach((property) => setHsl(property, background));
  ["--foreground", "--card-foreground", "--popover-foreground", "--secondary-foreground", "--accent-foreground"].forEach((property) => setHsl(property, foreground));
  ["--secondary", "--muted", "--accent"].forEach((property) => setHsl(property, surface));
  ["--primary", "--ring"].forEach((property) => setHsl(property, primary));
  ["--border", "--input"].forEach((property) => setHsl(property, border));
  setHsl("--destructive", danger);
  setRaw("--kvis-purple", primary);
  setRaw("--kvis-purple-light", accent);
  setRaw("--kvis-purple-soft", accent && softColor(accent));
  setRaw("--kvis-green", green);
  setRaw("--kvis-green-light", green);
  setRaw("--kvis-border", border);
  setRaw("--kvis-rule", border);
  setRaw("--admin-canvas", background);
  setRaw("--primary-foreground", primary && readableText(primary));
  setRaw("--destructive-foreground", danger && readableText(danger));
}

export function dispatchSiteTheme(colors: Partial<SiteThemeColors>) {
  applySiteTheme(colors);
  window.dispatchEvent(new CustomEvent("site-theme-changed", { detail: colors }));
}

export function SiteThemeLoader() {
  useEffect(() => {
    let active = true;
    siteThemeApi.get().then((theme) => {
      if (active) applySiteTheme(theme.colors);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  return null;
}
