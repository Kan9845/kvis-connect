"use client";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { searchApi, userApi } from "@/lib/api";
import { keys } from "@/lib/cache/keys";
import { SearchFilters } from "@/components/search/SearchFilters";
import type { SearchParams, GlobePin } from "@/lib/types";
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  type PointerEvent,
} from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useNavbarVariant } from "@/contexts/NavbarVariantContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const AlumniGlobe = dynamic(() => import("@/components/globe/AlumniGlobe"), {
  ssr: false,
});

interface Props {
  initialPins: GlobePin[];
}

export function LandingClient({ initialPins }: Props) {
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [panelOpen, setPanelOpen] = useState(true);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const sheetBodyRef = useRef<HTMLDivElement | null>(null);
  const collapsedMeasureRef = useRef<HTMLDivElement | null>(null);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [sheetDragHeight, setSheetDragHeight] = useState<number | null>(null);
  const [collapsedSheetHeight, setCollapsedSheetHeight] = useState<
    number | null
  >(null);
  const contentDragRef = useRef({
    tracking: false,
    pointerId: 0,
    startX: 0,
    startY: 0,
  });
  const sheetDragRef = useRef({
    active: false,
    startY: 0,
    startHeight: 0,
    minHeight: 0,
    maxHeight: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
  });
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

  const router = useRouter();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const canUseKvisianSearch = !!user;

  const goToKvisianSearch = () => {
    const value = q.trim();
    router.push(`/kvisian${value ? `?q=${encodeURIComponent(value)}` : ""}`);
  };

  useEffect(() => {
    setVariant(isDarkSky ? "dark" : "light");
    return () => setVariant("light");
  }, [setVariant, isDarkSky]);

  useEffect(() => {
    if (isDesktop || !panelOpen || !sheetRef.current) {
      setSheetHeight(0);
      return;
    }

    const update = () => {
      const height = sheetRef.current?.getBoundingClientRect().height ?? 0;
      setSheetHeight(height);
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(sheetRef.current);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [isDesktop, panelOpen, sheetExpanded]);

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
  const getExpandedSheetHeight = () =>
    typeof window === "undefined" ? 0 : Math.max(window.innerHeight - 64, 0);
  const getCollapsedSheetHeight = () => {
    if (typeof window === "undefined") {
      return collapsedSheetHeight ?? 0;
    }

    const viewportCap = Math.max(window.innerHeight - 84, 0);
    const measured =
      collapsedSheetHeight ??
      collapsedMeasureRef.current?.getBoundingClientRect().height ??
      0;

    return measured ? Math.min(measured, viewportCap) : 0;
  };

  useEffect(() => {
    if (isDesktop) {
      setCollapsedSheetHeight(null);
      return;
    }

    if (!collapsedMeasureRef.current) return;

    const update = () => {
      const measured =
        collapsedMeasureRef.current?.getBoundingClientRect().height ?? 0;
      const viewportCap = Math.max(window.innerHeight - 84, 0);
      setCollapsedSheetHeight(measured ? Math.min(measured, viewportCap) : null);
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(collapsedMeasureRef.current);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [isDesktop, hasFilter, isDarkSky, pins.length, resultCount]);

  const collapsedSnapHeight =
    collapsedSheetHeight ?? (isDesktop ? null : getCollapsedSheetHeight());
  const sheetTargetHeight =
    sheetDragHeight ??
    (sheetExpanded ? "calc(100dvh - 64px)" : collapsedSnapHeight || "auto");
  const sheetTargetMaxHeight =
    sheetExpanded || sheetDragHeight !== null
      ? "calc(100dvh - 64px)"
      : "calc(100dvh - 84px)";

  const beginSheetDrag = (
    event: PointerEvent<HTMLDivElement>,
    startY = event.clientY
  ) => {
    if (isDesktop || !sheetRef.current) return;

    const now = performance.now();
    const currentHeight = sheetRef.current.getBoundingClientRect().height;
    const minHeight = collapsedSnapHeight || currentHeight;
    const maxHeight = getExpandedSheetHeight();

    sheetDragRef.current = {
      active: true,
      startY,
      startHeight: currentHeight,
      minHeight,
      maxHeight,
      lastY: event.clientY,
      lastTime: now,
      velocity: 0,
    };
    setSheetDragHeight(currentHeight);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSheetDragStart = (event: PointerEvent<HTMLDivElement>) => {
    beginSheetDrag(event);
  };

  const handleSheetDragMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = sheetDragRef.current;
    if (!drag.active) return;

    const now = performance.now();
    const elapsed = Math.max(now - drag.lastTime, 1);
    drag.velocity = ((event.clientY - drag.lastY) / elapsed) * 1000;
    drag.lastY = event.clientY;
    drag.lastTime = now;

    const nextHeight = Math.min(
      Math.max(drag.startHeight - (event.clientY - drag.startY), drag.minHeight),
      drag.maxHeight
    );
    setSheetDragHeight(nextHeight);
  };

  const handleSheetDragEnd = (event: PointerEvent<HTMLDivElement>) => {
    const drag = sheetDragRef.current;
    if (!drag.active) return;

    const currentHeight =
      sheetRef.current?.getBoundingClientRect().height ?? sheetDragHeight ?? 0;
    const range = Math.max(drag.maxHeight - drag.minHeight, 1);
    const draggedOpenRatio = (currentHeight - drag.minHeight) / range;
    const shouldExpand =
      drag.velocity < -450 ||
      (drag.velocity <= 450 && draggedOpenRatio > 0.45);

    sheetDragRef.current.active = false;
    setSheetDragHeight(null);
    setSheetExpanded(shouldExpand);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const handleContentDragStart = (event: PointerEvent<HTMLDivElement>) => {
    if (isDesktop || !sheetExpanded || sheetDragRef.current.active) return;
    if (sheetBodyRef.current && sheetBodyRef.current.scrollTop > 0) return;

    const target = event.target as HTMLElement;
    if (
      target.closest(
        'button, input, textarea, select, a, [role="combobox"], [data-radix-popper-content-wrapper]'
      )
    ) {
      return;
    }

    contentDragRef.current = {
      tracking: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const handleContentDragMove = (event: PointerEvent<HTMLDivElement>) => {
    const pending = contentDragRef.current;
    if (!pending.tracking || pending.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - pending.startX;
    const deltaY = event.clientY - pending.startY;
    if (deltaY < 10 || Math.abs(deltaX) > Math.abs(deltaY)) return;
    if (sheetBodyRef.current && sheetBodyRef.current.scrollTop > 0) return;

    beginSheetDrag(event, pending.startY);
    handleSheetDragMove(event);
    contentDragRef.current.tracking = false;
  };

  const handleContentDragEnd = (event: PointerEvent<HTMLDivElement>) => {
    contentDragRef.current.tracking = false;
    handleSheetDragEnd(event);
  };
  const sheetDragHandlers = {
    onPointerDown: handleSheetDragStart,
    onPointerMove: handleSheetDragMove,
    onPointerUp: handleSheetDragEnd,
    onPointerCancel: handleSheetDragEnd,
  };

  const panelHeaderCls = `flex items-center justify-between px-4 pt-4 pb-2 border-b ${isDarkSky ? "border-white/30" : "border-[var(--kvis-border)]"}`;
  const closeBtnCls = `h-7 w-7 rounded-lg ${isDarkSky ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-900/5 hover:text-slate-900"}`;
  const filterBtnCls = `absolute z-20 h-auto gap-2 rounded-xl bg-transparent px-3 py-1.5 text-sm font-medium ${isDarkSky ? "border-white/50 text-white hover:bg-white/10 hover:text-white" : "border-[var(--sep-strong)] text-slate-900 hover:bg-slate-900/5 hover:text-slate-900"}`;

  const panelContent = (
    <>
      <div className={panelHeaderCls}>
        <div>
          <p
            className={`font-semibold text-sm ${isDarkSky ? "text-white" : "text-slate-900"}`}
          >
            {canUseKvisianSearch ? "Search Kvisians" : "Filter Alumni"}
          </p>
          <p
            className={`text-xs mt-0.5 ${isDarkSky ? "text-white/70" : "text-slate-600"}`}
          >
            {hasFilter ? `${resultCount} found` : `${pins.length} worldwide`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPanelOpen(false)}
          className={closeBtnCls}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {canUseKvisianSearch ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goToKvisianSearch();
            }}
            className={`flex items-center gap-3 px-3 py-2 border rounded-md ${
              isDarkSky ? "border-white/20 bg-white/5" : "border-[var(--kvis-border)]"
            }`}
          >
            <Search className={`h-4 w-4 shrink-0 ${isDarkSky ? "text-white/50" : "text-muted-foreground"}`} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search anything (e.g. name, university, interest, etc)"
              className={`flex-1 bg-transparent border-0 text-sm focus:outline-none ${
                isDarkSky
                  ? "text-white placeholder:text-white/40"
                  : "text-foreground placeholder:text-muted-foreground/50"
              }`}
            />
            {q && (
              <button type="button" onClick={() => setQ("")}>
                <X className={`h-3.5 w-3.5 ${isDarkSky ? "text-white/50" : "text-muted-foreground"}`} />
              </button>
            )}
          </form>
        ) : (
          <SearchFilters
            values={searchParams}
            onChange={setSearchParams}
            dark={isDarkSky}
          />
        )}
      </div>
    </>
  );

  return (
    <div
      className={`relative w-full h-full overflow-hidden isolate ${isDarkSky ? "bg-black" : "bg-white"}`}
    >
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
          {canUseKvisianSearch ? "Search Kvisians" : "Filter Alumni"}
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
              background: isDarkSky
                ? "rgba(2,6,18,0.55)"
                : "rgba(255,255,255,0.55)",
              border: isDarkSky
                ? "1px solid rgba(255,255,255,0.6)"
                : "1px solid var(--kvis-border)",
            }}
          >
            {panelContent}
          </div>
        </>
      )}

      {panelOpen && !isDesktop && (
        <>
          <div
            ref={collapsedMeasureRef}
            aria-hidden="true"
            className="invisible fixed inset-x-0 bottom-0 -z-10 flex flex-col overflow-hidden pointer-events-none"
            style={{
              maxHeight: "calc(100dvh - 84px)",
              background: isDarkSky
                ? "rgba(2,6,18,0.92)"
                : "rgba(255,255,255,0.92)",
              border: isDarkSky
                ? "1px solid rgba(255,255,255,0.2)"
                : "1px solid var(--kvis-rule)",
              borderBottom: "none",
            }}
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div
                className={`w-10 h-1 rounded-full ${isDarkSky ? "bg-white/25" : "bg-slate-300"}`}
              />
            </div>
            <div className="flex-shrink-0">
              <div
                className={`flex items-center justify-between px-4 pt-2 pb-2 border-b ${isDarkSky ? "border-white/20" : "border-slate-900/10"}`}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-semibold text-sm ${isDarkSky ? "text-white" : "text-slate-900"}`}
                  >
                    {canUseKvisianSearch ? "Search Kvisians" : "Filter Alumni"}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${isDarkSky ? "text-white/60" : "text-slate-500"}`}
                  >
                    {hasFilter
                      ? `${resultCount} found`
                      : `${pins.length} worldwide`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  tabIndex={-1}
                  className={closeBtnCls}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {!canUseKvisianSearch && (
                <SearchFilters
                  values={searchParams}
                  onChange={() => {}}
                  dark={isDarkSky}
                  forceSectionsClosed
                  measureOnly
                />
              )}
            </div>
          </div>

          {/* Mobile: bottom sheet */}
          <motion.div
            ref={sheetRef}
            className="fixed z-50 inset-x-0 bottom-0 flex min-h-0 flex-col overflow-hidden"
            animate={{
              height: sheetTargetHeight,
              borderRadius: "16px 16px 0 0",
            }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{
              maxHeight: sheetTargetMaxHeight,
              background: isDarkSky
                ? "rgba(2,6,18,0.92)"
                : "rgba(255,255,255,0.92)",
              border: isDarkSky
                ? "1px solid rgba(255,255,255,0.2)"
                : "1px solid var(--kvis-rule)",
              borderBottom: "none",
            }}
          >
            {/* Drag handle */}
            <motion.div
              className="flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
              {...sheetDragHandlers}
            >
              <div
                className={`w-10 h-1 rounded-full ${isDarkSky ? "bg-white/25" : "bg-slate-300"}`}
              />
            </motion.div>
            <div className="flex-shrink-0">
              <div
                className={`flex items-center justify-between px-4 pt-2 pb-2 border-b ${isDarkSky ? "border-white/20" : "border-slate-900/10"}`}
              >
                <div
                  className="min-w-0 flex-1 cursor-grab touch-none active:cursor-grabbing"
                  {...sheetDragHandlers}
                >
                  <p
                    className={`font-semibold text-sm ${isDarkSky ? "text-white" : "text-slate-900"}`}
                  >
                    {canUseKvisianSearch ? "Search Kvisians" : "Filter Alumni"}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${isDarkSky ? "text-white/60" : "text-slate-500"}`}
                  >
                    {hasFilter
                      ? `${resultCount} found`
                      : `${pins.length} worldwide`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPanelOpen(false)}
                  className={closeBtnCls}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div
              ref={sheetBodyRef}
              className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
              onPointerDown={handleContentDragStart}
              onPointerMove={handleContentDragMove}
              onPointerUp={handleContentDragEnd}
              onPointerCancel={handleContentDragEnd}
            >
              {canUseKvisianSearch ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    goToKvisianSearch();
                  }}
                  className={`flex items-center gap-3 px-3 py-2 border rounded-md ${
                    isDarkSky ? "border-white/20 bg-white/5" : "border-[var(--kvis-border)]"
                  }`}
                >
                  <Search className={`h-4 w-4 shrink-0 ${isDarkSky ? "text-white/50" : "text-muted-foreground"}`} />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search anything"
                    className={`flex-1 bg-transparent border-0 text-sm focus:outline-none ${
                      isDarkSky
                        ? "text-white placeholder:text-white/40"
                        : "text-foreground placeholder:text-muted-foreground/50"
                    }`}
                  />
                </form>
              ) : (
                <SearchFilters
                  values={searchParams}
                  onChange={setSearchParams}
                  dark={isDarkSky}
                />
              )}
            </div>
          </motion.div>
        </>
      )}

      {hasFilter && filteredPins?.length === 0 && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{
            bottom:
              !isDesktop && panelOpen && !sheetExpanded && sheetHeight > 0
                ? `${sheetHeight + 12}px`
                : "2rem",
          }}
        >
          <div
            className="px-5 py-3 rounded-xl text-center text-sm text-white"
            style={{
              background: "rgba(4,10,30,0.9)",
              border: "1px solid rgba(239,68,68,0.3)",
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
