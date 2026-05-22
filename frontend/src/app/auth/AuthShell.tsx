"use client";

export const P = {
  purple: "oklch(44% 0.26 294)",
  purpleSoft: "oklch(95% 0.035 294)",
  green: "oklch(40% 0.16 148)",
  ink: "oklch(20% 0.015 294)",
  text2: "oklch(45% 0.008 294)",
  text3: "oklch(62% 0.005 294)",
  rule: "oklch(90% 0.007 294)",
};

interface AuthShellProps {
  numeral: string;
  kicker: string;
  title: string;
  lede: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({ numeral, kicker, title, lede, children, footer }: AuthShellProps) {
  const issueLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-6xl px-6 lg:px-12 py-10 lg:py-16">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-20 items-start">
          <section
            className="lg:pr-10 lg:border-r lg:sticky lg:top-10"
            style={{ borderColor: P.rule }}
          >
            <div className="flex items-baseline gap-4 mb-5">
              <span
                className="font-mono font-black text-2xl tabular-nums"
                style={{ color: P.green, letterSpacing: "-0.02em" }}
              >
                {numeral}
              </span>
              <span
                className="text-[11px] uppercase tracking-[0.32em] font-bold"
                style={{ color: P.text3 }}
              >
                {kicker}
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.035em] leading-[0.9] text-foreground max-w-[12ch]">
              {title}
            </h1>
            <p className="mt-6 text-base lg:text-[17px] text-muted-foreground max-w-[42ch] leading-relaxed">
              {lede}
            </p>
            <div
              className="mt-12 pt-6 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.3em]"
              style={{ borderColor: P.rule, color: P.text3 }}
            >
              <span>KVIS Connect</span>
              <span className="tabular-nums">{issueLabel}</span>
            </div>
          </section>
          <section>
            <div className="max-w-md">
              {children}
              {footer && (
                <div
                  className="mt-12 pt-6 border-t text-xs"
                  style={{ borderColor: P.rule, color: P.text3 }}
                >
                  {footer}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export const editorialInputClass =
  "w-full bg-transparent border rounded-none px-4 py-3 text-[15px] text-foreground placeholder:text-foreground/25 focus:outline-none transition-colors";

export function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between mb-2">
      <span
        className="text-[10px] font-bold uppercase tracking-[0.28em] text-foreground/70"
      >
        {children}
      </span>
      {hint}
    </div>
  );
}
