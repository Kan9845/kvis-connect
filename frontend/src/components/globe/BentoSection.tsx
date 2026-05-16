"use client";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PieChart, Pie, Cell } from "recharts";
import type { Summary, BlogRead } from "@/lib/types";

interface Props {
  summary: Summary | null;
  posts: BlogRead[];
}

function useOnEnter(ref: React.RefObject<HTMLElement>) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setEntered(true);
      },
      { threshold: 0.2 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return entered;
}

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let cur = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      cur = Math.min(cur + step, target);
      setV(Math.floor(cur));
      if (cur >= target) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [active, target, duration]);
  return v;
}

const P = {
  purpleDark: "oklch(22% 0.18 294)",
  purpleMid: "oklch(34% 0.22 294)",
  purple: "oklch(44% 0.26 294)",
  purpleSoft: "oklch(95% 0.035 294)",
  green: "oklch(40% 0.16 148)",
  greenDark: "oklch(28% 0.14 148)",
  bg: "hsl(var(--background))",
  surface: "hsl(var(--card))",
  surface2: "hsl(var(--muted))",
  text1: "hsl(var(--foreground))",
  text2: "hsl(var(--muted-foreground))",
  text3: "hsl(var(--muted-foreground) / 0.7)",
  border: "hsl(var(--border))",
} as const;

const PAD = 20;
const shadow =
  "0 1px 3px oklch(0% 0 0 / 0.06), 0 8px 24px oklch(0% 0 0 / 0.07)";

const FIELD_COLORS: Record<string, string> = {
  Technology: P.purple,
  Engineering: P.green,
  Finance: "oklch(52% 0.18 230)",
  Business: "oklch(58% 0.18 60)",
  "Creative Arts": "oklch(56% 0.2 340)",
  Research: "oklch(50% 0.14 190)",
  Government: "oklch(46% 0.09 250)",
};

// ISO 3166-1 alpha-2 codes for flagcdn.com
const ISO_MAP: Record<string, string> = {
  Thailand: "th",
  "United States": "us",
  USA: "us",
  "United Kingdom": "gb",
  UK: "gb",
  Germany: "de",
  Singapore: "sg",
  Canada: "ca",
  France: "fr",
  Netherlands: "nl",
  Switzerland: "ch",
  Japan: "jp",
  Australia: "au",
  "South Korea": "kr",
  Sweden: "se",
  Denmark: "dk",
  Norway: "no",
  Finland: "fi",
  Italy: "it",
  Spain: "es",
  China: "cn",
  India: "in",
  Brazil: "br",
  Austria: "at",
  Belgium: "be",
  Poland: "pl",
  Taiwan: "tw",
  "Hong Kong": "hk",
  "New Zealand": "nz",
  Israel: "il",
};

function FlagImg({ country, size = 24 }: { country: string; size?: number }) {
  const iso = ISO_MAP[country];
  if (!iso)
    return (
      <span
        style={{
          width: size * 1.4,
          height: size,
          display: "inline-block",
          background: P.surface2,
          borderRadius: 3,
        }}
      />
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      width={Math.round(size * 1.4)}
      height={size}
      alt={country}
      style={{
        objectFit: "cover",
        borderRadius: 3,
        display: "block",
        flexShrink: 0,
      }}
    />
  );
}

function Label({
  children,
  color = P.text3,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <p
      className="text-xs font-bold tracking-widest uppercase mb-3"
      style={{ color }}
    >
      {children}
    </p>
  );
}

function AuthorAvatar({ post, size = 32 }: { post: BlogRead; size?: number }) {
  const initials =
    `${post.author.first_name[0]}${post.author.last_name[0]}`.toUpperCase();
  return (
    <div
      className="text-xs font-extrabold rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden relative"
      style={{
        width: size,
        height: size,
        background: P.purpleSoft,
        color: P.purple,
      }}
    >
      {post.author.profile_pic_url ? (
        <Image
          src={post.author.profile_pic_url}
          alt=""
          fill
          style={{ objectFit: "cover" }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

const RADIAN = Math.PI / 180;
const INNER_R_RATIO = 76 / 310;
const OUTER_R_RATIO = 104 / 310;

function renderCalloutLabel(props: {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  index: number;
  name: string;
  percent: number;
  payload: { isOther: boolean; color: string };
}) {
  const { cx, cy, midAngle, outerRadius, name, percent, payload } = props;
  if (payload.isOther || percent < 0.04) return null;

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 4) * cos;
  const sy = cy + (outerRadius + 4) * sin;
  const mx = cx + (outerRadius + 22) * cos;
  const my = cy + (outerRadius + 22) * sin;
  const ex = mx + (cos >= 0 ? 8 : -8);
  const anchor = cos >= 0 ? "start" : "end";
  const tx = ex + (cos >= 0 ? 3 : -3);
  const color = payload.color;

  return (
    <g>
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${my}`}
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeDasharray="3 2"
        opacity={0.65}
      />
      <text
        x={tx}
        y={my - 3}
        textAnchor={anchor}
        fontSize={12}
        fontWeight={700}
        fill={color}
        fontFamily="'Be Vietnam Pro',sans-serif"
      >
        {name}
      </text>
      <text
        x={tx}
        y={my + 12}
        textAnchor={anchor}
        fontSize={11}
        fontWeight={600}
        fill={color}
        opacity={0.75}
        fontFamily="'Be Vietnam Pro',sans-serif"
      >
        {Math.round(percent * 100)}%
      </text>
    </g>
  );
}

function DonutChart({
  segments,
  total,
  entered,
}: {
  segments: { field: string; fraction: number }[];
  total: number;
  entered: boolean;
}) {
  const [otherHovered, setOtherHovered] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize(Math.floor(Math.min(width, height)));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Recharts SVG clips labels by default — force overflow visible after mount
  useEffect(() => {
    const svg = svgWrapRef.current?.querySelector("svg");
    if (svg) (svg as SVGElement).style.overflow = "visible";
  });

  const sorted = [...segments].sort((a, b) => b.fraction - a.fraction);
  const top5 = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const otherFrac = rest.reduce((s, seg) => s + seg.fraction, 0);

  const pieData = [
    ...top5.map((s) => ({
      name: s.field,
      value: s.fraction,
      color: FIELD_COLORS[s.field] ?? P.text3,
      isOther: false,
    })),
    ...(otherFrac > 0.001
      ? [{ name: "Other", value: otherFrac, color: P.border, isOther: true }]
      : []),
  ];

  const innerR = size * INNER_R_RATIO;
  const outerR = size * OUTER_R_RATIO;

  return (
    <div
      ref={wrapperRef}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 0,
        minWidth: 0,
      }}
    >
      {size > 0 && entered && (
        <div
          ref={svgWrapRef}
          style={{
            position: "relative",
            width: size,
            height: size,
            flexShrink: 0,
            overflow: "visible",
          }}
        >
          <PieChart width={size} height={size}>
            <Pie
              data={pieData}
              cx={size / 2}
              cy={size / 2}
              innerRadius={innerR}
              outerRadius={outerR}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              label={renderCalloutLabel as any}
              labelLine={false}
              isAnimationActive={false}
              onMouseEnter={(_: unknown, index: number) => {
                if (pieData[index]?.isOther) setOtherHovered(true);
              }}
              onMouseLeave={() => setOtherHovered(false)}
              strokeWidth={0}
            >
              {pieData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  stroke="none"
                  style={{
                    cursor: entry.isOther ? "pointer" : "default",
                    outline: "none",
                  }}
                />
              ))}
            </Pie>
          </PieChart>

          {/* Center text overlay */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <p className="text-4xl font-black text-foreground leading-none tracking-tight tabular-nums">
              {total}
            </p>
            <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mt-1">
              Alumni
            </p>
          </div>

          {/* Other hover popover */}
          {otherHovered && rest.length > 0 && (
            <div
              className="bg-card dark:bg-secondary"
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                borderRadius: 12,
                padding: "10px 13px",
                boxShadow:
                  "0 2px 8px oklch(0% 0 0 / 0.1), 0 12px 32px oklch(0% 0 0 / 0.12)",
                minWidth: 148,
                zIndex: 10,
                pointerEvents: "none",
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Other fields</p>
              {rest.map((seg) => (
                <div key={seg.field} className="flex items-center gap-1.5 mb-1">
                  <span
                    className="w-1.5 h-1.5 rounded-sm flex-shrink-0"
                    style={{ background: FIELD_COLORS[seg.field] ?? P.text3 }}
                  />
                  <span className="flex-1 text-xs font-medium text-muted-foreground">{seg.field}</span>
                  <span className="text-xs font-bold tabular-nums text-muted-foreground">
                    {Math.round(seg.fraction * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const RANK_FILLS = [
  "oklch(44% 0.26 294)",
  "oklch(50% 0.22 294)",
  "oklch(58% 0.16 294)",
  "oklch(65% 0.12 294)",
  "oklch(72% 0.09 294)",
  "oklch(77% 0.07 294)",
  "oklch(81% 0.05 294)",
  "oklch(85% 0.04 294)",
  "oklch(88% 0.03 294)",
];

function FlagList({
  countries,
  total,
  entered,
}: {
  countries: [string, number][];
  total: number;
  entered: boolean;
}) {
  const allSorted = [...countries].sort(([, a], [, b]) => b - a);
  const top5 = allSorted.slice(0, 5);
  const otherCount = allSorted.slice(5).reduce((s, [, c]) => s + c, 0);
  const rows: [string, number][] = otherCount > 0 ? [...top5, ["Other", otherCount]] : top5;

  return (
    <div className="flex flex-col gap-3">
      {rows.map(([country, count], i) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const isOther = country === "Other";
        const fill = isOther ? "oklch(80% 0.01 294)" : (RANK_FILLS[i] ?? RANK_FILLS[RANK_FILLS.length - 1]);

        return (
          <div key={country} className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-shrink-0" style={{ width: 128 }}>
              {isOther ? (
                <span className="text-sm font-medium text-muted-foreground">Other</span>
              ) : (
                <>
                  <div className="flex-shrink-0 rounded-sm overflow-hidden" style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }}>
                    <FlagImg country={country} size={22} />
                  </div>
                  <span className="text-sm font-medium truncate text-muted-foreground">{country}</span>
                </>
              )}
            </div>

            <div className="flex-1 h-[8px] rounded-full overflow-hidden bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: entered ? `${pct}%` : "0%",
                  background: fill,
                  transition: `width 0.7s cubic-bezier(0.4,0,0.2,1) ${0.06 + i * 0.05}s`,
                }}
              />
            </div>

            <span
              className="flex-shrink-0 w-9 text-right text-sm font-bold tabular-nums"
              style={{ color: i === 0 ? P.purple : P.text3 }}
            >
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function BentoSection({ summary, posts }: Props) {
    const innerRef = useRef<HTMLDivElement>(null);
    const entered = useOnEnter(innerRef);

    const total = summary?.total ?? 0;
    const abroadPct =
      summary && total > 0
        ? Math.round(
            ((total - (summary.by_country["Thailand"] ?? 0)) / total) * 100,
          )
        : 0;

    const countries = summary
      ? Object.entries(summary.by_country).sort(([, a], [, b]) => b - a)
      : [];

    const fieldSegments = summary
      ? Object.entries(summary.by_job_field)
          .sort(([, a], [, b]) => b - a)
          .map(([field, count]) => ({
            field,
            fraction: total > 0 ? count / total : 0,
          }))
      : [];

    const [post1] = posts;

    const countTotal = useCountUp(total, entered, 1200);
    const countAbroad = useCountUp(abroadPct, entered, 1500);

    return (
      <div
        ref={innerRef}
        className="bg-muted dark:bg-background"
        style={{
          width: "100%",
          minHeight: "100%",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "calc(64px + clamp(10px, 1.2vh, 16px))",
          paddingBottom: "clamp(10px, 1.2vh, 16px)",
          paddingLeft: "clamp(12px, 1.8vw, 32px)",
          paddingRight: "clamp(12px, 1.8vw, 32px)",
          fontFamily: "'Be Vietnam Pro', -apple-system, sans-serif",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "min(calc(100vh - 96px), calc(100vw - 32px), 720px)",
            aspectRatio: "1 / 1",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: "repeat(4, 1fr)",
            gap: "clamp(6px, 0.8vmin, 10px)",
          }}
        >
          {/* ── DONUT CHART ── 2x2 top left */}
          <div
            className="bg-card dark:bg-secondary"
            style={{
              gridColumn: "1/3",
              gridRow: "1/3",
              borderRadius: 18,
              padding: 10,
              display: "flex",
              flexDirection: "column",
              boxShadow: shadow,
              minHeight: 0,
            }}
          >
            <DonutChart
              segments={fieldSegments}
              total={total}
              entered={entered}
            />
          </div>

          {/* ── FLAG LIST ── 2x2 bottom left, centered */}
          <div
            className="bg-card dark:bg-secondary"
            style={{
              gridColumn: "1/3",
              gridRow: "3/5",
              borderRadius: 18,
              padding: PAD,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              boxShadow: shadow,
              minHeight: 0,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <p className="text-base font-semibold text-foreground mb-4 text-center">
              Where alumni live
            </p>
            <FlagList countries={countries} total={total} entered={entered} />
          </div>

          {/* ── FEATURED EXPERIENCE ── 2-wide × 3-tall top right */}
          {post1 ? (
            <Link
              href={`/blog/${post1.slug}`}
              className="bg-card dark:bg-secondary"
              style={{
                gridColumn: "3/5",
                gridRow: "1/4",
                borderRadius: 18,
                padding: PAD,
                display: "flex",
                flexDirection: "column",
                textDecoration: "none",
                boxShadow: shadow,
                transition: "transform 0.22s ease, box-shadow 0.22s ease",
                minHeight: 0,
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-3px)";
                el.style.boxShadow = `0 4px 8px oklch(0% 0 0 / 0.08), 0 20px 48px oklch(44% 0.26 294 / 0.13)`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "";
                el.style.boxShadow = shadow;
              }}
            >
              <Label color={P.purple}>Featured experience</Label>

              {post1.cover_image_url && (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16 / 9",
                    borderRadius: 12,
                    overflow: "hidden",
                    marginBottom: 14,
                    flexShrink: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post1.cover_image_url}
                    alt={post1.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}

              <p className="text-lg font-bold text-foreground leading-snug tracking-tight mb-3">
                {post1.title}
              </p>

              {post1.excerpt && (
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 overflow-hidden">
                  {post1.excerpt}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  paddingTop: 14,
                  marginTop: 16,
                  borderTop: `1px solid ${P.border}`,
                }}
              >
                <AuthorAvatar post={post1} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="text-sm font-bold text-foreground truncate">
                    {post1.author.first_name} {post1.author.last_name}
                  </p>
                  {post1.author.kvis_year && (
                    <p className="text-xs text-muted-foreground font-medium">
                      Gen {post1.author.kvis_year}
                    </p>
                  )}
                </div>
                <span
                  className="text-xs font-bold flex-shrink-0"
                  style={{ color: P.purple }}
                >
                  Read →
                </span>
              </div>
            </Link>
          ) : (
            <div
              className="bg-card dark:bg-secondary"
              style={{
                gridColumn: "3/5",
                gridRow: "1/4",
                borderRadius: 18,
                padding: PAD,
                boxShadow: shadow,
              }}
            />
          )}

          {/* ── REGISTERED ALUMNI ── 1x1 bottom right (left of pair) */}
          <div
            style={{
              gridColumn: "3/4",
              gridRow: "4/5",
              background: P.purpleDark,
              borderRadius: 18,
              padding: "14px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                backgroundImage:
                  "radial-gradient(oklch(100% 0 0 / 0.045) 1px, transparent 1px)",
                backgroundSize: "13px 13px",
              }}
            />
            <p
              className="text-xs font-bold tracking-widest uppercase relative"
              style={{ color: "oklch(55% 0.06 294)" }}
            >
              Registered
            </p>
            <p
              className="text-4xl md:text-5xl font-black tabular-nums leading-none text-white relative"
              style={{ letterSpacing: "-0.05em" }}
            >
              {countTotal}
            </p>
            <p
              className="text-xs font-medium relative"
              style={{ color: "oklch(55% 0.06 294)" }}
            >
              alumni worldwide
            </p>
          </div>

          {/* ── ABROAD % ── 1x1 bottom right (right of pair) */}
          <div
            style={{
              gridColumn: "4/5",
              gridRow: "4/5",
              background: P.purpleDark,
              borderRadius: 18,
              padding: "14px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                backgroundImage:
                  "radial-gradient(oklch(100% 0 0 / 0.045) 1px, transparent 1px)",
                backgroundSize: "13px 13px",
              }}
            />
            <p
              className="text-xs font-bold tracking-widest uppercase relative"
              style={{ color: "oklch(55% 0.06 294)" }}
            >
              Abroad
            </p>
            <p
              className="text-4xl md:text-5xl font-black tabular-nums leading-none text-white relative"
              style={{ letterSpacing: "-0.05em" }}
            >
              {countAbroad}
              <span className="text-xl font-bold opacity-75 align-baseline">
                %
              </span>
            </p>
            <p
              className="text-xs font-medium relative"
              style={{ color: "oklch(55% 0.06 294)" }}
            >
              outside Thailand
            </p>
          </div>
        </div>
      </div>
    );
}
