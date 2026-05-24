"use client";

import { AvatarConfig } from "@/lib/avatarTypes";
import { AvatarCanvas } from "./AvatarCanvas";

interface Props {
  config: AvatarConfig;
  size?: number;
}

export function AvatarPreview({
  config,
  size = 320,
}: Props) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: size,
        height: size,
      }}
    >
      <AvatarCanvas config={config} />
    </div>
  );
}