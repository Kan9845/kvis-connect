"use client";

import Link from "next/link";
import { AnimatedGoose } from "@/components/goose/PixelGoose";

export default function NotFound() {
  return (
    <div
      className="bg-[var(--kvis-bg)] min-h-full flex items-center relative overflow-hidden"
      style={{ fontFamily: "var(--font-be-vietnam-pro), sans-serif" }}
    >
      {/* Typographic backdrop */}
      <span
        aria-hidden
        className="absolute text-foreground/[0.045] select-none pointer-events-none font-black"
        style={{
          right: "-0.05em",
          bottom: "-0.18em",
          fontSize: "clamp(18rem, 32vw, 40rem)",
          lineHeight: 1,
          letterSpacing: "-0.06em",
        }}
      >
        404
      </span>

      <div className="relative mx-auto w-full max-w-5xl px-6 lg:px-10 py-16 md:py-24">
        <div className="grid md:grid-cols-[1fr_auto] gap-16 md:gap-24 items-center">

          {/* Text side */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-10 text-[var(--kvis-green)]"
              style={{ letterSpacing: "0.12em" }}
            >
              Error 404
            </p>

            <h1
              className="font-black mb-6 text-[var(--kvis-ink)]"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 3.75rem)",
                lineHeight: 1.03,
                maxWidth: "14ch",
              }}
            >
              Somewhere off-campus.
            </h1>

            <div
              className="bg-[var(--kvis-rule)] mb-6"
              style={{ height: 1, maxWidth: "280px" }}
            />

            <p
              className="text-sm font-medium mb-12 text-[var(--kvis-text2)]"
              style={{ lineHeight: 1.85, maxWidth: "44ch" }}
            >
              This page doesn&apos;t exist or may have been moved. The goose searched the whole campus - it&apos;s not here.
            </p>

            <div className="flex items-center gap-8 flex-wrap">
              <Link href="/" className="text-sm font-bold text-[var(--kvis-purple)]">
                Return home
              </Link>
              <Link href="/kvisian" className="text-sm font-medium text-[var(--kvis-text3)]">
                Browse alumni
              </Link>
            </div>
          </div>

          {/* Goose side */}
          <div className="hidden md:flex justify-end">
            <AnimatedGoose scale={8} />
          </div>

        </div>
      </div>
    </div>
  );
}
