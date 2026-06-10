"use client";

import { useState } from "react";
import { AvatarConfig } from "@/lib/avatarTypes";
import { avatarOptions } from "@/components/avatar/avatarData";
import { AvatarOption } from "./AvatarOption";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  value: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
}

const categories = (Object.keys(avatarOptions) as (keyof typeof avatarOptions)[]).filter(c => c !== "background");
const requiredCategories = ["background", "eyes"];

export function AvatarCustomizer({ value, onChange }: Props) {
  const [categoryIndex, setCategoryIndex] = useState(0);

  const category = categories[categoryIndex];
  const options = avatarOptions[category];
  const currentValue = value?.[category as keyof AvatarConfig];
  const isRequired = requiredCategories.includes(category);

  const prev = () => setCategoryIndex((i) => Math.max(0, i - 1));
  const next = () => setCategoryIndex((i) => Math.min(categories.length - 1, i + 1));

  return (
    <div className="space-y-4">

      {/* Category navigator */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={prev}
          disabled={categoryIndex === 0}
          className="p-2 rounded-xl border border-gray-200 hover:border-gray-400 disabled:opacity-30 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">
            {categoryIndex + 1} / {categories.length}
          </p>
          <p className="text-base font-bold capitalize">{category}</p>
        </div>

        <button
          type="button"
          onClick={next}
          disabled={categoryIndex === categories.length - 1}
          className="p-2 rounded-xl border border-gray-200 hover:border-gray-400 disabled:opacity-30 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Category dots */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {categories.map((cat, i) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === categoryIndex
                ? "bg-foreground scale-125"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>

      {/* Options grid */}
      <div className="flex flex-wrap gap-3 justify-start pt-2">

        {/* None button */}
        {!isRequired && (
          <button
            type="button"
            onClick={() => onChange({ ...value, [category]: null })}
            className={`
              w-20 h-20 rounded-2xl border flex items-center justify-center
              transition-all duration-200
              ${currentValue === null
                ? "border-black scale-105 shadow-xl"
                : "border-gray-200 hover:border-gray-400"
              }
            `}
          >
            <svg viewBox="0 0 24 24" className="w-8 h-8" stroke="#7C3AED" strokeWidth={2.5} strokeLinecap="round">
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
            selected={currentValue === asset}
            onClick={() => onChange({ ...value, [category]: asset })}
          />
        ))}
      </div>
    </div>
  );
}