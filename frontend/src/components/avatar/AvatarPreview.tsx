"use client";

import { AvatarConfig } from "@/lib/avatarTypes";
import { AvatarCanvas } from "./AvatarCanvas";

interface Props {
  config: AvatarConfig;
  size?: number;
  backgroundColor?: string;
}

export function AvatarPreview({ config, size = 320, backgroundColor }: Props) {
  return (
    <div className="relative overflow-hidden" style={{ width: size, height: size }}>
      <AvatarCanvas config={config} backgroundColor={backgroundColor} />
    </div>
  );
}