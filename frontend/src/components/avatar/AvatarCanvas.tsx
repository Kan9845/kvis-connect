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
    <div className="relative w-full" style={{ paddingBottom: "100%" }}>
      <div className="absolute inset-0">
        {/* BACKGROUND - cohort color or fallback */}
        <div
          className="absolute inset-0"
          style={{
            background: backgroundColor ?? "#6d28d9"
          }}
        />

        <div className="absolute inset-0 scale-[1.26] origin-center">
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
      </div>
    </div>
  );
}
