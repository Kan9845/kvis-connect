"use client";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { searchApi, userApi } from "@/lib/api";
import { keys } from "@/lib/cache/keys";
import { SearchFilters } from "@/components/search/SearchFilters";
import type { SearchParams, GlobePin } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useNavbarVariant } from "@/contexts/NavbarVariantContext";

const AlumniGlobe = dynamic(() => import("@/components/globe/AlumniGlobe"), { ssr: false });

interface Props {
  initialPins: GlobePin[];
}

export function LandingClient({ initialPins }: Props) {
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [panelOpen, setPanelOpen] = useState(true);
  // Mount only ONE SearchFilters instance (desktop OR mobile). Two live
  // instances bound to the same state create a debounced two-way sync race
  // where one panel's stale timer echoes an old filter back over the other.
  const [isDesktop, setIsDesktop] = useState(true);
  const { setVariant } = useNavbarVariant();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const { resolvedTheme } = useTheme();
  const isDarkSky = resolvedTheme !== "light";

  useEffect(() => {
    setVariant(isDarkSky ? "dark" : "light");
    return () => setVariant("light");
  }, [setVariant, isDarkSky]);

  const { data: pins = initialPins } = useQuery({
    queryKey: keys.globe.pins(),
    queryFn: userApi.getGlobePins,
    placeholderData: initialPins,
    staleTime: 5 * 60 * 1000,
  });

  const hasFilter = Object.keys(searchParams).length > 0;

  const { data: searchResults = [] } = useQuery({
    queryKey: keys.search.query(searchParams),
    queryFn: () => searchApi.search(searchParams),
    enabled: hasFilter,
  });

  const filteredPins: GlobePin[] | undefined = useMemo(() => {
    if (!hasFilter) return undefined;
    const ids = new Set(searchResults.map((u) => u.id));
    return pins.filter((p) => ids.has(p.user_id));
  }, [hasFilter, searchResults, pins]);

  const resultCount = hasFilter ? (filteredPins?.length ?? 0) : pins.length;

  const panelHeaderCls = `flex items-center justify-between px-4 pt-4 pb-2 border-b ${isDarkSky ? "border-white/30" : "border-[var(--kvis-border)]"}`;
  const closeBtnCls = `h-7 w-7 rounded-lg ${isDarkSky ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-900/5 hover:text-slate-900"}`;
  const filterBtnCls = `absolute z-20 h-auto gap-2 rounded-xl bg-transparent px-3 py-1.5 text-sm font-medium ${isDarkSky ? "border-white/50 text-white hover:bg-white/10 hover:text-white" : "border-[var(--sep-strong)] text-slate-900 hover:bg-slate-900/5 hover:text-slate-900"}`;

  const panelContent = (
    <>
      <div className={panelHeaderCls}>
        <div>
          <p className={`font-semibold text-sm ${isDarkSky ? "text-white" : "text-slate-900"}`}>Filter Alumni</p>
          <p className={`text-xs mt-0.5 ${isDarkSky ? "text-white/70" : "text-slate-600"}`}>
            {hasFilter ? `${resultCount} found` : `${pins.length} worldwide`}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setPanelOpen(false)} className={closeBtnCls}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-[env(safe-area-inset-bottom)]">
        <SearchFilters values={searchParams} onChange={setSearchParams} dark={isDarkSky} />
      </div>
    </>
  );

  return (
    <div className={`relative w-full h-full overflow-hidden isolate ${isDarkSky ? "bg-black" : "bg-white"}`}>
      <AlumniGlobe pins={pins} filteredPins={filteredPins} />

      {!panelOpen && isDesktop && (
        /* Desktop: top-left */
        <Button
          variant="outline"
          onClick={() => setPanelOpen(true)}
          className={`flex ${filterBtnCls}`}
          style={{ top: 76, left: 20, borderWidth: "1.5px" }}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter
        </Button>
      )}

      {!panelOpen && !isDesktop && (
        /* Mobile: bottom-center */
        <Button
          variant="outline"
          onClick={() => setPanelOpen(true)}
          className={`${filterBtnCls} bottom-6 left-1/2 -translate-x-1/2`}
          style={{ borderWidth: "1.5px" }}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter Alumni
        </Button>
      )}

      {panelOpen && isDesktop && (
        <>
          {/* Desktop: side panel */}
          <div
            className="block absolute z-20 w-72 rounded-2xl overflow-y-auto"
            style={{
              top: 76,
              left: 20,
              maxHeight: "calc(100vh - 96px)",
              background: isDarkSky ? "rgba(2,6,18,0.55)" : "rgba(255,255,255,0.55)",
              border: isDarkSky ? "1px solid rgba(255,255,255,0.6)" : "1px solid var(--kvis-border)",
            }}
          >
            {panelContent}
          </div>
        </>
      )}

      {panelOpen && !isDesktop && (
        <>
          {/* Mobile: bottom sheet */}
          <div
            className="fixed z-50 inset-x-0 bottom-0 rounded-t-2xl flex flex-col"
            style={{
              maxHeight: "72dvh",
              background: isDarkSky ? "rgba(2,6,18,0.92)" : "rgba(255,255,255,0.92)",
              border: isDarkSky ? "1px solid rgba(255,255,255,0.2)" : "1px solid var(--kvis-rule)",
              borderBottom: "none",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className={`w-10 h-1 rounded-full ${isDarkSky ? "bg-white/25" : "bg-slate-300"}`} />
            </div>
            <div className="flex-shrink-0">
              <div className={`flex items-center justify-between px-4 pt-2 pb-2 border-b ${isDarkSky ? "border-white/20" : "border-slate-900/10"}`}>
                <div>
                  <p className={`font-semibold text-sm ${isDarkSky ? "text-white" : "text-slate-900"}`}>Filter Alumni</p>
                  <p className={`text-xs mt-0.5 ${isDarkSky ? "text-white/60" : "text-slate-500"}`}>
                    {hasFilter ? `${resultCount} found` : `${pins.length} worldwide`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setPanelOpen(false)} className={closeBtnCls}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-[env(safe-area-inset-bottom)]">
              <SearchFilters values={searchParams} onChange={setSearchParams} dark={isDarkSky} />
            </div>
          </div>
        </>
      )}

      {hasFilter && filteredPins?.length === 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div
            className="px-5 py-3 rounded-xl text-center text-sm text-white"
            style={{ background: "rgba(4,10,30,0.9)", border: "1px solid rgba(239,68,68,0.3)", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
          >
            No alumni matched your filters
          </div>
        </div>
      )}
    </div>
  );
}
