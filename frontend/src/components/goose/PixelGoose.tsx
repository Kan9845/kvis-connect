"use client";

import { useEffect, useMemo, useState } from "react";

const PALETTE: Record<string, string> = {
  W: "oklch(99% 0.005 90)",
  S: "oklch(92% 0.014 80)",
  T: "oklch(94% 0.018 80)",
  B: "oklch(78% 0.17 65)",
  P: "oklch(80% 0.14 20)",
  K: "oklch(18% 0.01 80)",
  e: "oklch(99% 0.005 90)",
  L: "oklch(30% 0.05 60)",
};

export const FRAME_IDLE = [
  "................................",
  "..............TT................",
  "............WWWWWW..............",
  "..........WWWWWWWWWW............",
  ".........WWWWWWWWWWWW...........",
  "........WWWWWWWWWWWWWW..........",
  ".......WWWWWWWWWWWWWWWW.........",
  ".......WWWWWWWWWWWWWWWW.........",
  ".......WWWKKWWWWWWKKWWW.........",
  ".......WWWKKWWWWWWKKWWW.........",
  ".......WWWWWWWWWWWWWWWW.........",
  ".......WPPWWWWWWWWWWPPW.........",
  ".......WWWWWBBBBBBWWWWW.........",
  "........WWWWBBBBBBWWWW..........",
  ".........WWWBBBBBBWWW...........",
  "...........BBBBBB...............",
  "............WWWWWW..............",
  "...........WWWWWWWW.............",
  "..........WWWWWWWWWW............",
  ".........WWWWWWWWWWWW...........",
  "........WWWWWWWWWWWWWW..........",
  ".......WWWWWWWWWWWWWWWW.........",
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

export const FRAME_BLINK = FRAME_IDLE.map((row, i) => {
  if (i === 8) return ".......WWWWWWWWWWWWWWWW.........";
  if (i === 9) return ".......WWWKKWWWWWWKKWWW.........";
  return row;
});

function withOutline(frame: string[]): string[] {
  const rows = frame.length;
  const cols = frame[0].length;
  const grid = frame.map((r) => r.split(""));
  const isBody = (r: number, c: number) =>
    r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c] !== ".";
  const out = grid.map((r) => [...r]);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== ".") continue;
      if (
        isBody(r - 1, c) ||
        isBody(r + 1, c) ||
        isBody(r, c - 1) ||
        isBody(r, c + 1)
      ) {
        out[r][c] = "L";
      }
    }
  }
  return out.map((r) => r.join(""));
}

export function PixelGoose({
  frame,
  scale = 4,
}: {
  frame: string[];
  scale?: number;
}) {
  const outlined = useMemo(() => withOutline(frame), [frame]);
  const size = 32;
  const rects: React.ReactNode[] = [];
  for (let r = 0; r < outlined.length; r++) {
    const row = outlined[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      const color = PALETTE[ch];
      if (!color) continue;
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={c * scale}
          y={r * scale}
          width={scale}
          height={scale}
          fill={color}
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

export function AnimatedGoose({ scale = 6 }: { scale?: number }) {
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
      className="goose-bob"
      style={{
        animation: "goose-bob 1.4s ease-in-out infinite",
        willChange: "transform",
      }}
    >
      <PixelGoose frame={blinking ? FRAME_BLINK : FRAME_IDLE} scale={scale} />
    </div>
  );
}
