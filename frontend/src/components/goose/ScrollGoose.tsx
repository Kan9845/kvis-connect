"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatedGoose } from "./PixelGoose";

function findScrollContainer(node: HTMLElement | null): HTMLElement | null {
  let el = node?.parentElement ?? null;
  while (el && el !== document.body) {
    const s = window.getComputedStyle(el);
    if (/(auto|scroll|overlay)/.test(s.overflowY + " " + s.overflow)) return el;
    el = el.parentElement;
  }
  return null;
}

// Motion design:
// - Enter: ease-out-quart 280ms, scale 0.6→1 + opacity 0→1 + slide up. One-time pop-in past threshold.
// - Idle: bob + blink inherited from AnimatedGoose.
// - Scroll reaction: head tilts opposite the scroll direction (inertia feel), then decays back.
// - Frequency: continuous, so easing is short and tilt magnitude is small to avoid distraction.
export function ScrollGoose({
  scale = 4,
  appearAt = 320,
  hideBelow = 160,
}: {
  scale?: number;
  appearAt?: number;
  hideBelow?: number;
}) {
  const [visible, setVisible] = useState(false);
  const [tilt, setTilt] = useState(0);
  const anchorRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef({ y: 0, t: 0 });
  const decayRef = useRef<number | null>(null);

  useEffect(() => {
    const container = findScrollContainer(anchorRef.current) ?? window;
    const getY = () =>
      container === window
        ? window.scrollY
        : (container as HTMLElement).scrollTop;

    const startY = getY();
    lastRef.current = { y: startY, t: performance.now() };
    if (startY > appearAt) setVisible(true);

    const onScroll = () => {
      const y = getY();
      const t = performance.now();
      const dy = y - lastRef.current.y;
      const dt = t - lastRef.current.t;
      lastRef.current = { y, t };

      setVisible((prev) => {
        if (!prev && y > appearAt) return true;
        if (prev && y < hideBelow) return false;
        return prev;
      });

      if (dt > 0) {
        const vel = dy / dt;
        const target = Math.max(-9, Math.min(9, -vel * 4));
        setTilt((cur) => (Math.abs(target) > Math.abs(cur) ? target : cur));
      }

      if (decayRef.current) cancelAnimationFrame(decayRef.current);
      const decay = () => {
        setTilt((prev) => {
          const next = prev * 0.88;
          if (Math.abs(next) < 0.1) {
            decayRef.current = null;
            return 0;
          }
          decayRef.current = requestAnimationFrame(decay);
          return next;
        });
      };
      decayRef.current = requestAnimationFrame(decay);
    };

    const target = container === window ? window : (container as HTMLElement);
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      if (decayRef.current) cancelAnimationFrame(decayRef.current);
    };
  }, [appearAt, hideBelow]);

  return (
    <div
      ref={anchorRef}
      aria-hidden
      style={{
        position: "fixed",
        right: "clamp(12px, 3vw, 28px)",
        bottom: "clamp(12px, 3vw, 28px)",
        zIndex: 40,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transform: visible
          ? "scale(1) translateY(0)"
          : "scale(0.6) translateY(24px)",
        transformOrigin: "bottom right",
        transition:
          "opacity 280ms cubic-bezier(.165,.84,.44,1), transform 280ms cubic-bezier(.165,.84,.44,1)",
        willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          transform: `rotate(${tilt.toFixed(2)}deg)`,
          transformOrigin: "50% 85%",
          transition: "transform 80ms linear",
          willChange: "transform",
        }}
      >
        <AnimatedGoose scale={scale} />
      </div>
    </div>
  );
}
