"use client";
import { useRef, useEffect, useState, forwardRef, useId } from "react";
import Link from "next/link";
import Image from "next/image";
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
      ([entry]) => { if (entry.isIntersecting) setEntered(true); },
      { threshold: 0.25 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return entered;
}

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start = Math.min(start + step, target);
      setValue(Math.floor(start));
      if (start >= target) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [active, target, duration]);
  return value;
}

const RING_R = 22;
const RING_C = 2 * Math.PI * RING_R;

export const BentoSection = forwardRef<HTMLDivElement, Props>(
  function BentoSection({ summary, posts }, forwardedRef) {
    const innerRef = useRef<HTMLDivElement>(null);
    const mergeRef = (node: HTMLDivElement | null) => {
      (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    };
    const entered = useOnEnter(innerRef);
    const gradId = useId();

    const total = summary?.total ?? 0;
    const abroadPct =
      summary && total > 0
        ? Math.round(((total - (summary.by_country["Thailand"] ?? 0)) / total) * 100)
        : 0;
    const countriesCount = summary ? Object.keys(summary.by_country).length : 0;
    const topFieldEntry = summary
      ? Object.entries(summary.by_job_field).sort(([, a], [, b]) => b - a)[0]
      : null;
    const topFieldPct =
      topFieldEntry && total > 0 ? Math.round((topFieldEntry[1] / total) * 100) : 0;
    const ringOffset = RING_C * (1 - topFieldPct / 100);
    const topCountries = summary
      ? Object.entries(summary.by_country).sort(([, a], [, b]) => b - a).slice(0, 6)
      : [];

    const countTotal = useCountUp(total, entered);
    const countAbroad = useCountUp(abroadPct, entered, 1600);

    const [post1, post2] = posts;

    return (
      <div
        ref={mergeRef}
        className="relative w-screen flex-shrink-0"
        style={{
          height: "100vh",
          scrollSnapAlign: "start",
          background: "#040e24",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 clamp(16px, 4vw, 56px)",
        }}
      >
        <style>{`
  @keyframes kvis-pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.4); opacity: 0; } }
`}</style>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", maxWidth: 920, width: "100%", margin: "0 auto 20px" }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
              KVIS Alumni Network · Est. 1996
            </div>
            <h2 style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 800, background: "linear-gradient(100deg,#fff 30%,#93c5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
              Where are we now?
            </h2>
          </div>
          <Link href="/stats" style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none", opacity: 0.6 }}>
            Full statistics →
          </Link>
        </div>

        {/* Mixed bento grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gridTemplateRows: "140px 120px 120px", gap: 10, maxWidth: 920, width: "100%", margin: "0 auto" }}>

          {/* HERO — col 1-4, row 1-2 */}
          <div style={{ gridColumn: "1/5", gridRow: "1/3", background: "linear-gradient(145deg,#0d1f3c,#162d56)", border: "1px solid rgba(59,130,246,0.35)", borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "20px 20px", pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: -30, bottom: -30, width: 120, height: 120, background: "radial-gradient(circle,rgba(59,130,246,0.2),transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
            <div style={{ position: "relative", fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Alumni on the globe
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: "clamp(48px,5vw,64px)", fontWeight: 900, lineHeight: 1, letterSpacing: -2, color: "white" }}>{countTotal}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>registered alumni worldwide</div>
            </div>
            <div style={{ position: "relative", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                <PulseDot /> Active network
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                {countriesCount} countries
              </span>
            </div>
          </div>

          {/* ABROAD — col 5-7, row 1 */}
          <div style={{ gridColumn: "5/8", gridRow: "1/2", background: "linear-gradient(135deg,rgba(52,211,153,0.12),rgba(16,185,129,0.06))", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -30, right: -30, width: 90, height: 90, background: "radial-gradient(circle,rgba(52,211,153,0.2),transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Living abroad</div>
            <div>
              <div style={{ fontSize: "clamp(36px,4vw,46px)", fontWeight: 900, color: "#34d399", lineHeight: 1, letterSpacing: -1 }}>{countAbroad}%</div>
              <div style={{ fontSize: 11, color: "rgba(52,211,153,0.55)", marginTop: 3 }}>of tracked alumni</div>
            </div>
          </div>

          {/* FEATURED BLOG — col 8-12, row 1-2 */}
          {post1 && (
            <Link
              href={`/blog/${post1.slug}`}
              style={{ gridColumn: "8/13", gridRow: "1/3", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", textDecoration: "none", cursor: "pointer", transition: "border-color 0.25s,background 0.25s,transform 0.25s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(96,165,250,0.45)"; (e.currentTarget as HTMLElement).style.background = "rgba(96,165,250,0.04)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
            >
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.15em", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <span style={{ width: 16, height: 1, background: "rgba(255,255,255,0.15)", display: "inline-block" }} />
                  Featured experience
                </div>
                <div style={{ fontSize: "clamp(14px,1.8vw,17px)", fontWeight: 700, color: "white", lineHeight: 1.4, marginBottom: 8 }}>{post1.title}</div>
                {post1.excerpt && (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {post1.excerpt}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <AuthorAvatar post={post1} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{post1.author.first_name} {post1.author.last_name}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{post1.author.kvis_year ? `Gen ${post1.author.kvis_year}` : ""}</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#60a5fa", opacity: 0.7 }}>Read →</span>
              </div>
            </Link>
          )}

          {/* TOP FIELD RING — col 5-7, row 2 */}
          {topFieldEntry && (
            <div style={{ gridColumn: "5/8", gridRow: "2/3", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16, display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="28" cy="28" r={RING_R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                  <circle cx="28" cy="28" r={RING_R} fill="none" stroke={`url(#${gradId})`} strokeWidth="5" strokeLinecap="round" strokeDasharray={RING_C} strokeDashoffset={entered ? ringOffset : RING_C} style={{ transition: "stroke-dashoffset 1.5s ease 0.3s" }} />
                  <defs>
                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "white" }}>{topFieldPct}%</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 5 }}>Top field</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{topFieldEntry[0]}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{topFieldEntry[1]} alumni</div>
              </div>
            </div>
          )}

          {/* COUNTRIES — col 1-6, row 3 */}
          <div style={{ gridColumn: "1/7", gridRow: "3/4", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 10 }}>
              Top destinations · <span style={{ color: "rgba(255,255,255,0.45)" }}>{countriesCount} countries</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {topCountries.map(([country], i) => (
                <span key={country} style={{ background: i === 0 ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.06)", border: `1px solid ${i === 0 ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.08)"}`, color: i === 0 ? "#93c5fd" : "rgba(255,255,255,0.55)", borderRadius: 20, padding: "5px 13px", fontSize: 12 }}>
                  {country}
                </span>
              ))}
              {summary && Object.keys(summary.by_country).length > 6 && (
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, padding: "5px 6px" }}>+{Object.keys(summary.by_country).length - 6} more</span>
              )}
            </div>
          </div>

          {/* BLOG POST 2 — col 7-12, row 3 */}
          {post2 && (
            <Link
              href={`/blog/${post2.slug}`}
              style={{ gridColumn: "7/13", gridRow: "3/4", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16, display: "flex", alignItems: "center", gap: 14, textDecoration: "none", cursor: "pointer", transition: "border-color 0.25s,transform 0.25s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(96,165,250,0.4)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
            >
              <AuthorAvatar post={post2} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 5 }}>Experience</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{post2.title}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>
                  {post2.author.first_name} {post2.author.last_name}{post2.author.kvis_year ? ` · Gen ${post2.author.kvis_year}` : ""}
                </div>
              </div>
              <span style={{ fontSize: 11, color: "#60a5fa", opacity: 0.7, flexShrink: 0 }}>Read →</span>
            </Link>
          )}

        </div>

        {/* Footer link */}
        <div style={{ textAlign: "center", maxWidth: 920, width: "100%", margin: "14px auto 0" }}>
          <Link href="/blog" style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em", textDecoration: "none", textTransform: "uppercase" }}>
            View all experience posts
          </Link>
        </div>
      </div>
    );
  }
);

function PulseDot() {
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 10, height: 10 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", display: "block", position: "relative", zIndex: 1 }} />
      <span style={{ position: "absolute", inset: -2, borderRadius: "50%", background: "rgba(52,211,153,0.35)", animation: "kvis-pulse 1.8s ease-out infinite" }} />
    </span>
  );
}

function AuthorAvatar({ post, size = 32 }: { post: BlogRead; size?: number }) {
  const initials = `${post.author.first_name.charAt(0)}${post.author.last_name.charAt(0)}`.toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#1e3a5f", border: "2px solid #3b82f6", fontSize: size * 0.34, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", position: "relative" }}>
      {post.author.profile_pic_url
        ? <Image src={post.author.profile_pic_url} alt={`${post.author.first_name} ${post.author.last_name}`} fill style={{ objectFit: "cover" }} />
        : initials}
    </div>
  );
}
