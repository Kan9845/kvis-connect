"use client";

import { AvatarConfig } from "@/lib/avatarTypes";

interface Props {
  config: AvatarConfig;
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

export function AvatarCanvas({ config }: Props) {
  return (
    <div className="relative w-full h-full">

      {/* LAYOUT MASK */}
      <img
        src="/goose/layout.png"
        alt=""
        className="absolute inset-0 w-full h-full z-50 pointer-events-none"
      />

      {/* BACKGROUND */}
      {config.background && (
        <img
          src={`/goose/${config.background}.png`}
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}

      {/* BODY — ALWAYS EXISTS */}
      <img
        src="/goose/goose_base.png"
        alt=""
        className="absolute inset-0 w-full h-full object-contain"
      />

      {/* OTHER LAYERS */}
      {layers.map((layer) => {
        if (layer === "background") return null;

        const asset = config[layer];

        if (!asset) return null;

        return (
          <img
            key={layer}
            src={`/goose/${asset}.png`}
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
          />
        );
      })}
    </div>
  );
}