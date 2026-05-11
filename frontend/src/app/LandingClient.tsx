"use client";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { summaryApi, searchApi, userApi } from "@/lib/api";
import { SearchFilters } from "@/components/search/SearchFilters";
import type { SearchParams, GlobePin, Summary, BlogRead } from "@/lib/types";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

const AlumniGlobe = dynamic(() => import("@/components/globe/AlumniGlobe"), { ssr: false });

interface Props {
  initialPins: GlobePin[];
  initialSummary: Summary | null;
  initialPosts: BlogRead[];
}

export function LandingClient({ initialPins, initialSummary, initialPosts }: Props) {
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [panelOpen, setPanelOpen] = useState(true);

  const { data: pins = initialPins } = useQuery({
    queryKey: ["globe-pins"],
    queryFn: userApi.getGlobePins,
    initialData: initialPins,
    staleTime: 5 * 60 * 1000,
  });

  const { data: summary = initialSummary ?? undefined } = useQuery({
    queryKey: ["summary"],
    queryFn: summaryApi.getSummary,
    initialData: initialSummary ?? undefined,
    staleTime: 5 * 60 * 1000,
  });

  const hasFilter = Object.keys(searchParams).length > 0;

  const { data: searchResults = [] } = useQuery({
    queryKey: ["search", searchParams],
    queryFn: () => searchApi.search(searchParams),
    enabled: hasFilter,
  });

  const filteredPins: GlobePin[] | undefined = hasFilter
    ? (() => {
        const ids = new Set(searchResults.map((u) => u.id));
        return pins.filter((p) => ids.has(p.user_id));
      })()
    : undefined;

  const resultCount = hasFilter ? (filteredPins?.length ?? 0) : pins.length;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950" style={{ maxWidth: "100vw" }}>
      {/* Full-screen globe */}
      <AlumniGlobe pins={pins} filteredPins={filteredPins} />

      {/* ── Filter toggle (when panel closed) ── */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className="absolute z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
          style={{
            top: 76,
            left: 20,
            background: "transparent",
            border: "1.5px solid rgba(255,255,255,0.5)",
          }}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter
        </button>
      )}

      {/* ── Floating filter panel ── */}
      {panelOpen && (
        <div
          className="absolute z-20 w-72 rounded-2xl overflow-y-auto"
          style={{
            top: 76,
            left: 20,
            maxHeight: "calc(100vh - 72px)",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 12px 48px rgba(0,0,0,0.35)",
          }}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
            <div>
              <p className="font-semibold text-sm text-gray-900">Filter Alumni</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {hasFilter ? `${resultCount} found` : `${pins.length} worldwide`}
              </p>
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 py-4">
            <SearchFilters values={searchParams} onChange={setSearchParams} />
          </div>
        </div>
      )}

      {/* No results toast */}
      {hasFilter && filteredPins?.length === 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div
            className="px-5 py-3 rounded-xl text-center text-sm text-white"
            style={{
              background: "rgba(4,10,30,0.9)",
              border: "1px solid rgba(239,68,68,0.3)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            }}
          >
            No alumni matched your filters
          </div>
        </div>
      )}
    </div>
  );
}
