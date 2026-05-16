"use client";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { searchApi, userApi } from "@/lib/api";
import { SearchFilters } from "@/components/search/SearchFilters";
import type { SearchParams, GlobePin } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useNavbarVariant } from "@/contexts/NavbarVariantContext";

const AlumniGlobe = dynamic(() => import("@/components/globe/AlumniGlobe"), { ssr: false });

interface Props {
  initialPins: GlobePin[];
}

export function LandingClient({ initialPins }: Props) {
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [panelOpen, setPanelOpen] = useState(true);
  const { setVariant } = useNavbarVariant();
  const { resolvedTheme } = useTheme();
  const isDarkSky = resolvedTheme !== "light";

  useEffect(() => {
    setVariant(isDarkSky ? "dark" : "light");
    return () => setVariant("light");
  }, [setVariant, isDarkSky]);

  const { data: pins = initialPins } = useQuery({
    queryKey: ["globe-pins"],
    queryFn: userApi.getGlobePins,
    initialData: initialPins,
    staleTime: 5 * 60 * 1000,
  });

  const hasFilter = Object.keys(searchParams).length > 0;

  const { data: searchResults = [] } = useQuery({
    queryKey: ["search", searchParams],
    queryFn: () => searchApi.search(searchParams),
    enabled: hasFilter,
  });

  const filteredPins: GlobePin[] | undefined = useMemo(() => {
    if (!hasFilter) return undefined;
    const ids = new Set(searchResults.map((u) => u.id));
    return pins.filter((p) => ids.has(p.user_id));
  }, [hasFilter, searchResults, pins]);

  const resultCount = hasFilter ? (filteredPins?.length ?? 0) : pins.length;

  return (
    <div className={`relative w-full h-full overflow-hidden ${isDarkSky ? "bg-black" : "bg-white"}`}>
      <AlumniGlobe pins={pins} filteredPins={filteredPins} />

      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className={`absolute z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${isDarkSky ? "text-white" : "text-slate-900"}`}
          style={{ top: 76, left: 20, background: "transparent", border: isDarkSky ? "1.5px solid rgba(255,255,255,0.5)" : "1.5px solid rgba(15,23,42,0.4)" }}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter
        </button>
      )}

      {panelOpen && (
        <div
          className="absolute z-20 w-72 rounded-2xl overflow-y-auto"
          style={{
            top: 76,
            left: 20,
            maxHeight: "calc(100vh - 96px)",
            background: "transparent",
            border: isDarkSky ? "1px solid rgba(255,255,255,0.6)" : "1px solid rgba(15,23,42,0.25)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className={`flex items-center justify-between px-4 pt-4 pb-2 border-b ${isDarkSky ? "border-white/30" : "border-slate-900/15"}`}>
            <div>
              <p className={`font-semibold text-sm ${isDarkSky ? "text-white" : "text-slate-900"}`}>Filter Alumni</p>
              <p className={`text-xs mt-0.5 ${isDarkSky ? "text-white/70" : "text-slate-600"}`}>
                {hasFilter ? `${resultCount} found` : `${pins.length} worldwide`}
              </p>
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              className={`p-1.5 rounded-lg transition-colors ${isDarkSky ? "text-white/70 hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-slate-900 hover:bg-slate-900/5"}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-4 py-4">
            <SearchFilters values={searchParams} onChange={setSearchParams} dark={isDarkSky} />
          </div>
        </div>
      )}

      {hasFilter && filteredPins?.length === 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div
            className="px-5 py-3 rounded-xl text-center text-sm text-white"
            style={{ background: "rgba(4,10,30,0.9)", border: "1px solid rgba(239,68,68,0.3)", backdropFilter: "blur(12px)", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
          >
            No alumni matched your filters
          </div>
        </div>
      )}
    </div>
  );
}
