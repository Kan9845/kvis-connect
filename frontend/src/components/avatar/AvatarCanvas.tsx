"use client";

import { AvatarConfig } from "@/lib/avatarTypes";

interface Props {
  config: AvatarConfig;
  backgroundColor?: string;
}

const layers = [
  "background",
  "eyes",
  "brows",
  "hair",
  "head",
  "glasses",
  "cheek",
  "neck",
  "hand",
] as const;

export function AvatarCanvas({ config, backgroundColor }: Props) {
  return (
    <div className="relative w-full h-full">
      <img src="/goose/layout.png" alt="" className="absolute inset-0 w-full h-full z-50 pointer-events-none" />

      {/* BACKGROUND - cohort color or fallback */}
      <div
        className="absolute inset-0"
        style={{
          background: backgroundColor ?? "#6d28d9"
        }}
      />

      <img src="/goose/goose_base.png" alt="" className="absolute inset-0 w-full h-full object-contain" />

      {layers.map((layer) => {
        if (layer === "background") return null;
        const asset = config[layer];
        if (!asset) return null;
        return (
          <img key={layer} src={`/goose/${asset}.png`} alt="" className="absolute inset-0 w-full h-full object-contain" />
        );
      })}
    </div>
  );
}
