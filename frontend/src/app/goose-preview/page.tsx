"use client";

import { useEffect, useState } from "react";

// KVIS Today mascot — pixel sprite draft.
// Visit /goose-preview in the dev server. Delete this route after sign-off.

const KVIS = {
  purple: "oklch(44% 0.26 294)",
  green: "oklch(40% 0.16 148)",
  ink: "oklch(20% 0.015 294)",
  text2: "oklch(45% 0.008 294)",
  text3: "oklch(62% 0.005 294)",
  rule: "oklch(90% 0.007 294)",
  paper: "oklch(99% 0.003 90)",
};

const PALETTE: Record<string, { color: string; label: string }> = {
  W: { color: "oklch(99% 0.005 90)", label: "Body white" },
  S: { color: "oklch(92% 0.014 80)", label: "Body shadow" },
  T: { color: "oklch(94% 0.018 80)", label: "Top tuft" },
  B: { color: "oklch(78% 0.17 65)", label: "Bill / feet orange" },
  P: { color: "oklch(83% 0.10 25)", label: "Cheek pink" },
  K: { color: "oklch(18% 0.01 80)", label: "Eye" },
  e: { color: "oklch(99% 0.005 90)", label: "Eye highlight" },
};

// 32×32 grid. Every row must be exactly 32 chars.
const FRAME_IDLE = [
  "................................",
  "..............TT................",
  "............WWWWWW..............",
  "..........WWWWWWWWWW............",
  ".........WWWWWWWWWWWW...........",
  "........WWWWWWWWWWWWWW..........",
  "........WWKeWWWWWWeKWW..........",
  "........WWKKWWWWWWKKWW..........",
  "........WWKKWWWWWWKKWW..........",
  "........WPWWWWWWWWWWPW..........",
  "........WWWWBBBBBBWWWW..........",
  ".........WWWBBBBBBWWW...........",
  "...........BBBBBB...............",
  "............WWWWWW..............",
  ".............WWWW...............",
  ".............WWWW...............",
  "............WWWWWW..............",
  "..........WWWWWWWWWW............",
  ".........WWWWWWWWWWWW...........",
  "........WWWWWWWWWWWWWW..........",
  ".......WWWWWWWWWWWWWWWW.........",
  "......WWWWWWWWWWWWWWWWWWS.......",
  "......WWWWWWWWWWWWWWWWWWS.......",
  "......WWWWWWWWWWWWWWWWWWS.......",
  ".......WWWWWWWWWWWWWWWWS........",
  "........WWWWWWWWWWWWWWS.........",
  ".........WWWWWWWWWWWWS..........",
  "..........SSSSSSSSSS............",
  "..........BBB......BBB..........",
  ".........BBBBB....BBBBB.........",
  "................................",
  "................................",
];

// Blink: eyes squint into a thin line.
const FRAME_BLINK = FRAME_IDLE.map((row, i) => {
  if (i === 6 || i === 8) return "........WWWWWWWWWWWWWW..........";
  if (i === 7) return "........WWKKWWWWWWKKWW..........";
  return row;
});

function PixelGoose({
  frame,
  scale = 4,
}: {
  frame: string[];
  scale?: number;
}) {
  const size = 32;
  const rects: React.ReactNode[] = [];
  for (let r = 0; r < frame.length; r++) {
    const row = frame[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      const entry = PALETTE[ch];
      if (!entry) continue;
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={c * scale}
          y={r * scale}
          width={scale}
          height={scale}
          fill={entry.color}
          shapeRendering="crispEdges"
        />,
      );
    }
  }
  return (
    <svg
      width={size * scale}
      height={size * scale}
      viewBox={`0 0 ${size * scale} ${size * scale}`}
      style={{ display: "block", imageRendering: "pixelated" }}
      aria-label="KVIS pixel mascot"
    >
      {rects}
    </svg>
  );
}

function AnimatedGoose({ scale = 6 }: { scale?: number }) {
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const t = Date.now() % 3600;
      setBlinking(t < 140);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      style={{
        animation: "duck-bob 1.6s ease-in-out infinite alternate",
        willChange: "transform",
      }}
    >
      <PixelGoose frame={blinking ? FRAME_BLINK : FRAME_IDLE} scale={scale} />
      <style>{`
        @keyframes duck-bob {
          from { transform: translateY(0); }
          to   { transform: translateY(-3px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="duck-bob"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function Card({
  label,
  children,
  bg = KVIS.paper,
}: {
  label: string;
  children: React.ReactNode;
  bg?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex items-center justify-center"
        style={{
          background: bg,
          padding: "28px",
          border: `1px solid ${KVIS.rule}`,
          minHeight: 260,
          minWidth: 260,
        }}
      >
        {children}
      </div>
      <p
        className="text-xs uppercase tracking-[0.24em] font-bold"
        style={{ color: KVIS.text3 }}
      >
        {label}
      </p>
    </div>
  );
}

export default function GoosePreview() {
  return (
    <div style={{ background: KVIS.paper, color: KVIS.ink }} className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 lg:px-10 py-12">
        <header className="pb-6 border-b" style={{ borderColor: KVIS.rule }}>
          <p
            className="text-xs font-bold uppercase tracking-[0.3em] mb-3"
            style={{ color: KVIS.purple }}
          >
            KVIS Connect · Internal draft
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-[-0.025em] leading-[1.02]">
            KVIS pixel mascot · take 2
          </h1>
          <p
            className="mt-3 text-sm max-w-[60ch] leading-relaxed"
            style={{ color: KVIS.text2 }}
          >
            32×32 sprite based on the KVIS Today mascot. Big round eyes with inner
            highlights, pink cheek blush, wide duck bill, top tuft, webbed feet.
            Two frames (idle + blink). Animated version bobs and blinks.
          </p>
        </header>

        <section className="py-10 border-b" style={{ borderColor: KVIS.rule }}>
          <p
            className="text-xs uppercase tracking-[0.28em] font-bold mb-5"
            style={{ color: KVIS.text3 }}
          >
            Palette
          </p>
          <div className="flex flex-wrap gap-6">
            {Object.entries(PALETTE).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <div
                  style={{
                    width: 28,
                    height: 28,
                    background: v.color,
                    border: `1px solid ${KVIS.rule}`,
                  }}
                />
                <div>
                  <p className="text-sm font-semibold">{v.label}</p>
                  <p
                    className="text-xs font-mono"
                    style={{ color: KVIS.text3 }}
                  >
                    {v.color}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10 border-b" style={{ borderColor: KVIS.rule }}>
          <p
            className="text-xs uppercase tracking-[0.28em] font-bold mb-5"
            style={{ color: KVIS.text3 }}
          >
            Scale comparison · idle frame
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card label="1× — 32px (favicon)">
              <PixelGoose frame={FRAME_IDLE} scale={1} />
            </Card>
            <Card label="3× — 96px (corner)">
              <PixelGoose frame={FRAME_IDLE} scale={3} />
            </Card>
            <Card label="5× — 160px (masthead)">
              <PixelGoose frame={FRAME_IDLE} scale={5} />
            </Card>
            <Card label="8× — 256px (hero)">
              <PixelGoose frame={FRAME_IDLE} scale={8} />
            </Card>
          </div>
        </section>

        <section className="py-10 border-b" style={{ borderColor: KVIS.rule }}>
          <p
            className="text-xs uppercase tracking-[0.28em] font-bold mb-5"
            style={{ color: KVIS.text3 }}
          >
            Frames · 7× zoom
          </p>
          <div className="grid grid-cols-2 gap-6">
            <Card label="Frame A — idle">
              <PixelGoose frame={FRAME_IDLE} scale={7} />
            </Card>
            <Card label="Frame B — blink">
              <PixelGoose frame={FRAME_BLINK} scale={7} />
            </Card>
          </div>
        </section>

        <section className="py-10 border-b" style={{ borderColor: KVIS.rule }}>
          <p
            className="text-xs uppercase tracking-[0.28em] font-bold mb-5"
            style={{ color: KVIS.text3 }}
          >
            Animated · bob + blink
          </p>
          <div className="grid grid-cols-2 gap-6">
            <Card label="On paper" bg={KVIS.paper}>
              <AnimatedGoose scale={7} />
            </Card>
            <Card label="On stats purple tint" bg="oklch(95% 0.035 294)">
              <AnimatedGoose scale={7} />
            </Card>
          </div>
        </section>

        <section className="py-10">
          <p
            className="text-xs uppercase tracking-[0.28em] font-bold mb-5"
            style={{ color: KVIS.text3 }}
          >
            In context · stats masthead mock
          </p>
          <div
            className="px-6 lg:px-10 py-10"
            style={{ background: KVIS.paper, border: `1px solid ${KVIS.rule}` }}
          >
            <div className="pb-7 border-b" style={{ borderColor: KVIS.ink }}>
              <div className="flex items-end justify-between gap-6 flex-wrap">
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-[0.3em] mb-3"
                    style={{ color: KVIS.purple }}
                  >
                    KVIS Connect · Stats
                  </p>
                  <h1 className="text-5xl md:text-6xl font-black tracking-[-0.03em] leading-[0.95]">
                    By the Numbers
                  </h1>
                </div>
                <AnimatedGoose scale={5} />
              </div>
              <p
                className="mt-4 text-sm max-w-[60ch] leading-relaxed"
                style={{ color: KVIS.text2 }}
              >
                Where KVIS alumni went to study after graduation — the faculties they
                chose, the universities that took them in, and the countries they
                ended up in.
              </p>
            </div>
          </div>
        </section>

        <footer
          className="mt-10 pt-6 border-t text-xs uppercase tracking-[0.22em]"
          style={{ borderColor: KVIS.ink, color: KVIS.text3 }}
        >
          — Draft preview · delete this route after sign-off —
        </footer>
      </div>
    </div>
  );
}
