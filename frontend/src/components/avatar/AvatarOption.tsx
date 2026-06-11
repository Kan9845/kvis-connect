"use client";

interface Props {
  asset: string;
  category: string;
  selected: boolean;
  onClick: () => void;
}

export function AvatarOption({ asset, category, selected, onClick }: Props) {
  const isBackground = category === "background";

  return (
    <button
      onClick={onClick}
      className={`
        relative w-20 h-20 rounded-2xl overflow-hidden
        border transition-all duration-300
        ${selected
          ? "border-black scale-105 shadow-xl"
          : "border-gray-200 hover:border-gray-400"
        }
      `}
    >
      {/* bg color behind everything */}
      {!isBackground && (
        <div
          className="absolute inset-0"
          style={{ background: "var(--kvis-green)" }}
        />
      )}

      {/* goose base (skip for background category) */}
      {!isBackground && (
        <img
          src="/goose/goose_base.png"
          alt=""
          className="absolute inset-0 w-full h-full object-contain scale-150"
        />
      )}

      {/* the actual asset */}
      <img
        src={`/goose/${asset}.png`}
        alt={asset}
        className="absolute inset-0 w-full h-full object-contain scale-150"
        draggable={false}
      />
    </button>
  );
}