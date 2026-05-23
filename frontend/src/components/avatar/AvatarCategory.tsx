"use client";

import { AvatarOption } from "./AvatarOption";

interface Props {
  category: string;
  options: string[];
  value: string | null;
  onSelect: (asset: string | null) => void;
  allowNone?: boolean;
}

export function AvatarCategory({
  category,
  options,
  value,
  onSelect,
  allowNone = true,
}: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold capitalize">
        {category}
      </h3>

      <div className="flex flex-wrap gap-3">

        {allowNone && (
          <button
            onClick={() => onSelect(null)}
            className={`
              w-20 h-20 rounded-2xl border bg-white
              flex items-center justify-center
              transition-all
            
              ${
                value === null
                  ? "border-black scale-105 shadow-xl"
                  : "border-gray-200 hover:border-gray-400"
              }
            `}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8"
              stroke="#7C3AED"
              strokeWidth={2.5}
              strokeLinecap="round"
            >
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
        )}

        {options.map((asset) => (
          <AvatarOption
            key={asset}
            asset={asset}
            category={category}
            selected={value === asset}
            onClick={() => onSelect(asset)}
          />
        ))}
      </div>
    </div>
  );
}