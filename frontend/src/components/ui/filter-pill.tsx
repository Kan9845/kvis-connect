"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface FilterPillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  count?: number;
  activeColor?: string;
}

const FilterPill = React.forwardRef<HTMLButtonElement, FilterPillProps>(
  ({ active, count, children, className, activeColor, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "group inline-flex items-baseline text-sm font-semibold uppercase tracking-[0.14em] leading-none transition-colors rounded-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "underline underline-offset-[6px] decoration-2"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
      style={active && activeColor ? { color: activeColor, textDecorationColor: activeColor } : undefined}
      {...props}
    >
      <span>{children}</span>
      {count !== undefined && (
        <sup className="ml-1 text-xs font-mono tabular-nums text-muted-foreground/70">
          {count}
        </sup>
      )}
    </button>
  ),
);
FilterPill.displayName = "FilterPill";

export { FilterPill };