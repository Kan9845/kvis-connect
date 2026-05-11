"use client";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { summaryApi, searchApi, userApi, blogApi } from "@/lib/api";
import { SearchFilters } from "@/components/search/SearchFilters";
import { BentoSection } from "@/components/globe/BentoSection";
import type { SearchParams, GlobePin, Summary, BlogRead } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";

const AlumniGlobe = dynamic(() => import("@/components/globe/AlumniGlobe"), { ssr: false });

interface Props {
  initialPins: GlobePin[];
  initialSummary: Summary | null;
  initialPosts: BlogRead[];
}

export function LandingClient({ initialPins, initialSummary, initialPosts }: Props) {
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [panelOpen, setPanelOpen] = useState(true);
  const [arrowVisible, setArrowVisible] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);

  // Fade in down-arrow after 1.5s
  useEffect(() => {
    const t = setTimeout(() => setArrowVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Track active section for side dots
  useEffect(() => {
    const sections = [section1Ref.current, section2Ref.current];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = sections.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActiveSection(idx);
          }
        });
      },
      { root: containerRef.current, threshold: 0.5 }
    );
    sections.forEach((s) => s && obs.observe(s));
    return () => obs.disconnect();
  }, []);

  const scrollToSection = (idx: number) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: idx * container.clientHeight, behavior: "smooth" });
  };

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

  const { data: posts = initialPosts } = useQuery({
    queryKey: ["landing-posts"],
    queryFn: () => blogApi.list({ limit: 2 }),
    initialData: initialPosts,
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
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "100vh", overflowY: "scroll", scrollSnapType: "y mandatory", maxWidth: "100vw" }}
    >
      {/* ── SECTION 1: Globe ── */}
      <div
        ref={section1Ref}
        className="relative bg-slate-950"
        style={{ width: "100%", height: "100vh", flexShrink: 0, scrollSnapAlign: "start", overflow: "hidden" } as React.CSSProperties}
      >
        <AlumniGlobe pins={pins} filteredPins={filteredPins} />

        {/* Filter toggle */}
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ top: 76, left: 20, background: "transparent", border: "1.5px solid rgba(255,255,255,0.5)" }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
          </button>
        )}

        {/* Floating filter panel */}
        {panelOpen && (
          <div
            className="absolute z-20 w-72 rounded-2xl overflow-y-auto"
            style={{ top: 76, left: 20, maxHeight: "calc(100vh - 72px)", background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 12px 48px rgba(0,0,0,0.35)" }}
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
              style={{ background: "rgba(4,10,30,0.9)", border: "1px solid rgba(239,68,68,0.3)", backdropFilter: "blur(12px)", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
            >
              No alumni matched your filters
            </div>
          </div>
        )}

        {/* Down-arrow scroll trigger */}
        <button
          onClick={() => scrollToSection(1)}
          aria-label="Scroll to summary"
          style={{
            position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
            zIndex: 20, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)",
            opacity: arrowVisible ? 1 : 0,
            transition: "opacity 0.6s ease, background 0.2s",
            animation: arrowVisible ? "kvis-bounce 2s ease-in-out infinite" : "none",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
        >
          <ChevronDown className="h-5 w-5 text-white" />
        </button>
        <style>{`@keyframes kvis-bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(5px)}}`}</style>
      </div>

      {/* ── SECTION 2: Bento ── */}
      <BentoSection ref={section2Ref} summary={summary ?? null} posts={posts} />

      {/* ── Side navigation dots ── */}
      <div style={{ position: "fixed", right: 20, top: "50%", transform: "translateY(-50%)", zIndex: 50, display: "flex", flexDirection: "column", gap: 10 }}>
        {[0, 1].map((i) => (
          <button
            key={i}
            onClick={() => scrollToSection(i)}
            aria-label={`Go to section ${i + 1}`}
            style={{
              width: i === activeSection ? 8 : 6,
              height: i === activeSection ? 8 : 6,
              borderRadius: "50%",
              background: i === activeSection ? "white" : "rgba(255,255,255,0.35)",
              border: "none", cursor: "pointer", padding: 0,
              transition: "all 0.25s ease",
              boxShadow: i === activeSection ? "0 0 6px rgba(255,255,255,0.5)" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}
