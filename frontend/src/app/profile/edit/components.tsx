"use client";
import React from "react";
import { Globe, Lock, CornerDownRight } from "lucide-react";

export function SectionHead({
  numeral,
  kicker,
  title,
}: {
  numeral: string;
  kicker: React.ReactNode;
  title: string;
}) {
  return (
    <header className="pt-8 pb-4">
      <div className="flex items-baseline gap-3 mb-2">
        <span
          className="font-mono font-black text-xl tabular-nums text-[var(--kvis-green-light)]"
          style={{ letterSpacing: "-0.02em" }}
        >
          {numeral}
        </span>
        <span className="flex items-center gap-1 text-xs uppercase tracking-[0.28em] font-bold text-[var(--kvis-text3)]">
          {kicker}
        </span>
      </div>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-[-0.025em] leading-[1.02] text-foreground max-w-[22ch]">
        {title}
      </h2>
    </header>
  );
}

export function FieldRow({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-6 gap-y-2 py-5">
      <div className="md:pt-2.5">
        <span className="text-xs uppercase tracking-[0.24em] font-bold text-[var(--kvis-text3)]">
          {label}
          {required && <span className="text-[var(--kvis-purple)]"> *</span>}
        </span>
      </div>
      <div className="min-w-0">
        {children}
        {hint && (
          <p className="flex items-start gap-1 mt-1.5">
            <CornerDownRight
              className="shrink-0 h-3 w-3 mt-0.5 text-[var(--kvis-text3)]"
              aria-hidden
            />
            <span className="text-xs text-[var(--kvis-text3)] leading-[1.5]">
              {hint}
            </span>
          </p>
        )}
        {error && (
          <p className="text-xs mt-1.5 font-semibold text-[var(--kvis-purple)]">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export function PrivacyToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] transition-colors"
      style={{ color: value ? "var(--kvis-green-light)" : "var(--kvis-text3)" }}
    >
      {value ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {value ? "Public" : "KVIS only"}
    </button>
  );
}

export function TagPills({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (o: string) =>
    onChange(
      selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o],
    );
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => toggle(o)}
          className="px-2.5 py-1.5 text-xs font-semibold transition-colors border"
          style={{
            background: selected.includes(o)
              ? "var(--kvis-purple)"
              : "transparent",
            color: selected.includes(o) ? "white" : "var(--foreground)",
            borderColor: selected.includes(o)
              ? "var(--kvis-purple)"
              : "var(--kvis-border)",
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export const inputCls =
  "w-full bg-transparent border-0 border-b border-[var(--sep-input)] rounded-none px-0 py-2 text-sm md:text-base text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-[var(--sep-input-focus)] transition-colors";

export const textareaCls =
  "w-full bg-transparent border border-[var(--sep-input)] rounded-none px-3 py-2 text-sm md:text-base text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-[var(--sep-input-focus)] transition-colors";

export const selectTriggerCls =
  "w-full bg-transparent border-0 border-b border-[var(--sep-input)] rounded-none px-0 py-2 text-sm md:text-base text-foreground data-[placeholder]:text-muted-foreground/50 focus:ring-0 focus:ring-offset-0 focus-visible:border-[var(--sep-input-focus)] transition-colors";
