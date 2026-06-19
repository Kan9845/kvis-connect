"use client";
import { memo, useRef, useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import type { GlobePin } from "@/lib/types";
import { hasValidGlobeCoords } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Loaded via a wrapper because next/dynamic does not forward refs; the wrapper
// takes the ref as a `globeRef` prop so the imperative API stays reachable.
const Globe = dynamic(() => import("./GlobeWrapper"), { ssr: false });

// Editorial palette - matches /blog, /stats, /kvisian.
const P = {
  purple: "oklch(44% 0.26 294)",
  purpleSoft: "oklch(95% 0.035 294)",
  green: "oklch(40% 0.16 148)",
  ink: "oklch(20% 0.015 294)",
  text2: "oklch(45% 0.008 294)",
  text3: "oklch(62% 0.005 294)",
  rule: "oklch(90% 0.007 294)",
  paper: "oklch(99% 0.003 294)",
};

interface PinCluster {
  key: string;
  latitude: number;
  longitude: number;
  place?: string;
  country?: string;
  members: GlobePin[];
}

// Pins for users at the same (country, state) are geocoded to identical
// coordinates by the backend. Group them so a single visual represents the
// whole location, with a count badge instead of stacked invisible duplicates.
function clusterPins(pins: GlobePin[], precision: number): PinCluster[] {
  const map = new Map<string, PinCluster>();
  for (const p of pins) {
    if (!hasValidGlobeCoords(p)) continue;
    const key = `${p.latitude.toFixed(precision)},${p.longitude.toFixed(precision)}`;
    const existing = map.get(key);
    if (existing) {
      existing.members.push(p);
      if (!existing.place && p.place) existing.place = p.place;
      if (!existing.country && p.country) existing.country = p.country;
    } else {
      map.set(key, {
        key,
        latitude: p.latitude,
        longitude: p.longitude,
        place: p.place,
        country: p.country,
        members: [p],
      });
    }
  }
  const clusters = Array.from(map.values());
  clusters.forEach((c) => {
    c.members.sort((a: GlobePin, b: GlobePin) => {
      const ay = a.kvis_year ?? 99;
      const by = b.kvis_year ?? 99;
      if (ay !== by) return ay - by;
      return (a.first_name ?? "").localeCompare(b.first_name ?? "");
    });
  });
  return clusters;
}

interface AlumniGlobeProps {
  pins: GlobePin[];
  filteredPins?: GlobePin[];
}

// --------- shared DOM hover card (lives outside React) ---------
interface CardState {
  card: HTMLElement;
  hideTimer: number | null;
}
let cardState: CardState | null = null;

function getCard(): CardState {
  if (cardState && document.body.contains(cardState.card)) return cardState;
  const card = document.createElement("div");
  card.id = "__kvis_globe_card";
  card.style.cssText = `
    position:fixed;
    width:264px;
    background:${P.paper};
    color:${P.ink};
    border:1px solid ${P.rule};
    border-radius:0;
    padding:14px 14px 12px;
    opacity:0;
    pointer-events:none;
    transition:opacity 0.18s ease-out;
    box-shadow:0 18px 42px -14px rgba(15,23,42,0.45),0 4px 10px rgba(15,23,42,0.12);
    font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;
    z-index:30;
    top:0;left:0;
    will-change:transform,opacity;
  `;
  document.body.appendChild(card);

  const state: CardState = { card, hideTimer: null };
  card.addEventListener("mouseenter", () => {
    if (state.hideTimer) {
      clearTimeout(state.hideTimer);
      state.hideTimer = null;
    }
  });
  card.addEventListener("mouseleave", () => hideCard());
  cardState = state;
  return state;
}

function showCardAt(anchor: HTMLElement) {
  const { card } = getCard();
  card.style.transform = "none";
  card.style.opacity = "0";
  card.style.pointerEvents = "auto";
  card.style.left = "0px";
  card.style.top = "0px";

  // Force layout so we can measure final dimensions.
  const cw = card.offsetWidth || 264;
  const ch = card.offsetHeight || 120;
  const margin = 10;
  const gap = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const rect = anchor.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  let left = cx - cw / 2;
  left = Math.max(margin, Math.min(left, vw - cw - margin));

  // Prefer placing above the pin; fall back to below if no room above.
  const spaceAbove = rect.top - gap - margin;
  const spaceBelow = vh - rect.bottom - gap - margin;
  let top: number;
  if (spaceAbove >= ch) {
    top = rect.top - gap - ch;
  } else if (spaceBelow >= ch) {
    top = rect.bottom + gap;
  } else {
    // Neither side fits - clamp to viewport, biasing toward whichever has more room.
    top = spaceAbove >= spaceBelow ? margin : vh - ch - margin;
  }
  top = Math.max(margin, Math.min(top, vh - ch - margin));

  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
  card.style.opacity = "1";
}

function hideCard(delay = 200) {
  const state = cardState;
  if (!state) return;
  if (state.hideTimer) clearTimeout(state.hideTimer);
  state.hideTimer = window.setTimeout(() => {
    state.card.style.opacity = "0";
    state.card.style.pointerEvents = "none";
    state.hideTimer = null;
  }, delay);
}

function cancelHide() {
  const state = cardState;
  if (state?.hideTimer) {
    clearTimeout(state.hideTimer);
    state.hideTimer = null;
  }
}

function initials(p: GlobePin) {
  return `${(p.first_name?.[0] ?? "").toUpperCase()}${(p.last_name?.[0] ?? "").toUpperCase()}`;
}

function avatarEl(p: GlobePin, size: number, fontSize: number): HTMLElement {
  const av = document.createElement("div");
  av.style.cssText = `
    width:${size}px;height:${size}px;border-radius:50%;
    background:${P.purple};color:#fff;
    display:flex;align-items:center;justify-content:center;
    font-size:${fontSize}px;font-weight:800;letter-spacing:-0.02em;
    overflow:hidden;flex-shrink:0;
  `;
  if (p.profile_pic_url) {
    const img = document.createElement("img");
    img.src = p.profile_pic_url;
    img.loading = "lazy";
    img.decoding = "async";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;";
    img.onerror = () => {
      img.remove();
      av.textContent = initials(p);
    };
    av.appendChild(img);
  } else {
    av.textContent = initials(p);
  }
  return av;
}

function makeMemberRow(p: GlobePin, onNavigate: (slug: string) => void): HTMLElement {
  const row = document.createElement("button");
  row.type = "button";
  row.style.cssText = `
    display:flex;align-items:center;gap:10px;
    width:100%;padding:7px 6px;
    background:transparent;border:0;border-radius:0;
    text-align:left;cursor:pointer;
    transition:background 0.12s ease-out;
    font-family:inherit;
  `;
  row.addEventListener("mouseenter", () => {
    row.style.background = P.purpleSoft;
  });
  row.addEventListener("mouseleave", () => {
    row.style.background = "transparent";
  });
  row.addEventListener("click", () => {
    onNavigate(p.slug);
    hideCard(0);
  });

  row.appendChild(avatarEl(p, 28, 10));

  const text = document.createElement("div");
  text.style.cssText = "min-width:0;flex:1;";
  const name = document.createElement("div");
  name.style.cssText = `
    font-size:13px;font-weight:600;color:${P.ink};
    line-height:1.2;letter-spacing:-0.005em;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  `;
  name.textContent = `${p.first_name} ${p.last_name}`;
  text.appendChild(name);

  const metaParts = [p.kvis_year ? `K${p.kvis_year}` : null, p.current_job]
    .filter(Boolean)
    .join(" / ");
  if (metaParts) {
    const m = document.createElement("div");
    m.style.cssText = `
      font-size:11px;color:${P.text3};margin-top:1px;
      font-variant-numeric:tabular-nums;
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    `;
    m.textContent = metaParts;
    text.appendChild(m);
  }
  row.appendChild(text);

  const arrow = document.createElement("span");
  arrow.style.cssText = `color:${P.text3};flex-shrink:0;display:flex;align-items:center;`;
  arrow.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
  row.appendChild(arrow);

  return row;
}

function populateCard(cluster: PinCluster, onNavigate: (slug: string) => void) {
  const { card } = getCard();
  card.innerHTML = "";
  card.style.position = "fixed";

  // Close button - always present, critical for touch where hover-out never fires
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.style.cssText = `
    position:absolute;top:8px;right:8px;
    width:22px;height:22px;padding:0;
    background:transparent;border:none;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    color:${P.text3};font-size:13px;line-height:1;
    border-radius:4px;
  `;
  closeBtn.textContent = "×";
  closeBtn.addEventListener("mouseenter", () => { closeBtn.style.color = P.ink; });
  closeBtn.addEventListener("mouseleave", () => { closeBtn.style.color = P.text3; });
  closeBtn.addEventListener("click", (e) => { e.stopPropagation(); hideCard(0); });
  card.appendChild(closeBtn);

  const isCluster = cluster.members.length > 1;
  // `place` already encodes "City, Country" (e.g. "Bangkok, Thailand"), so
  // don't append country a second time. Only fall back to country alone.
  const locLabel = cluster.place || cluster.country || "Unknown location";

  // Editorial kicker row
  const head = document.createElement("div");
  head.style.cssText = `
    display:flex;align-items:baseline;justify-content:space-between;gap:8px;
    padding-bottom:8px;border-bottom:1px solid ${P.rule};margin-bottom:10px;
  `;
  const kicker = document.createElement("div");
  kicker.style.cssText = `
    font-size:9px;font-weight:700;text-transform:uppercase;
    letter-spacing:0.26em;color:${P.purple};
  `;
  kicker.textContent = "Location";
  head.appendChild(kicker);

  const tally = document.createElement("div");
  tally.style.cssText = `
    font-size:10px;font-weight:700;color:${P.text3};
    font-variant-numeric:tabular-nums;letter-spacing:0.18em;
    text-transform:uppercase;
  `;
  tally.textContent = `${cluster.members.length} ${cluster.members.length === 1 ? "alum" : "alumni"}`;
  head.appendChild(tally);
  card.appendChild(head);

  // Place - bold editorial display
  const place = document.createElement("div");
  place.style.cssText = `
    font-size:18px;font-weight:800;letter-spacing:-0.015em;
    color:${P.ink};line-height:1.18;margin-bottom:12px;
  `;
  place.textContent = locLabel;
  card.appendChild(place);

  if (!isCluster) {
    const p = cluster.members[0];

    const row = document.createElement("button");
    row.type = "button";
    row.style.cssText = `
      display:flex;align-items:flex-start;gap:11px;
      width:100%;padding:0;background:transparent;border:0;
      cursor:pointer;text-align:left;font-family:inherit;
    `;
    row.addEventListener("click", () => {
      onNavigate(p.slug);
      hideCard(0);
    });

    row.appendChild(avatarEl(p, 44, 14));

    const text = document.createElement("div");
    text.style.cssText = "min-width:0;flex:1;";
    const name = document.createElement("div");
    name.style.cssText = `
      font-size:15px;font-weight:700;color:${P.ink};
      letter-spacing:-0.01em;line-height:1.2;
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    `;
    name.textContent = `${p.first_name} ${p.last_name}`;
    text.appendChild(name);

    const meta = [p.kvis_year ? `K${p.kvis_year}` : null, p.mbti]
      .filter(Boolean)
      .join(" / ");
    if (meta) {
      const m = document.createElement("div");
      m.style.cssText = `
        font-size:11px;color:${P.text3};margin-top:3px;
        font-variant-numeric:tabular-nums;letter-spacing:0.04em;
      `;
      m.textContent = meta;
      text.appendChild(m);
    }
    if (p.current_job) {
      const j = document.createElement("div");
      j.style.cssText = `
        font-size:12px;color:${P.text2};margin-top:5px;line-height:1.35;
        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
        overflow:hidden;
      `;
      j.textContent = p.current_job;
      text.appendChild(j);
    }
    row.appendChild(text);
    card.appendChild(row);

    const link = document.createElement("div");
    link.style.cssText = `
      margin-top:11px;padding-top:8px;border-top:1px solid ${P.rule};
      font-size:10px;font-weight:700;text-transform:uppercase;
      letter-spacing:0.24em;color:${P.purple};
    `;
    link.style.display = "flex";
    link.style.alignItems = "center";
    link.style.gap = "4px";
    link.innerHTML = `View profile <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    card.appendChild(link);
    return;
  }

  // Cluster: scrollable list of members
  const list = document.createElement("div");
  list.style.cssText = `
    max-height:248px;overflow-y:auto;
    margin:0 -6px;
    scrollbar-width:thin;
  `;
  cluster.members.forEach((m) => list.appendChild(makeMemberRow(m, onNavigate)));
  card.appendChild(list);

  const hint = document.createElement("div");
  hint.style.cssText = `
    margin-top:9px;padding-top:8px;border-top:1px solid ${P.rule};
    font-size:9px;font-weight:700;text-transform:uppercase;
    letter-spacing:0.24em;color:${P.text3};
    font-variant-numeric:tabular-nums;
  `;
  hint.textContent = `Tap a name to open profile`;
  card.appendChild(hint);
}

function makePinEl(
  cluster: PinCluster,
  onNavigate: (slug: string) => void,
): HTMLElement {
  const first = cluster.members[0];
  const isCluster = cluster.members.length > 1;
  const size = 44;

  const wrap = document.createElement("div");
  wrap.style.cssText = `
    cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    pointer-events:auto;
  `;

  // Inner positioning context so the badge can anchor without giving the
  // outer wrap a `position`, which would conflict with react-globe.gl's
  // CSS3DRenderer transforms and stack every pin at the page origin.
  const inner = document.createElement("div");
  inner.style.cssText = `
    position:relative;display:inline-flex;
    align-items:center;justify-content:center;
  `;
  wrap.appendChild(inner);

  const avatar = document.createElement("div");
  const baseShadow = `0 2px 8px rgba(15,23,42,0.35),0 0 0 2px rgba(255,255,255,0.55)`;
  avatar.style.cssText = `
    width:${size}px;height:${size}px;border-radius:50%;
    background:${P.paper};
    border:2px solid ${P.purple};
    overflow:hidden;
    display:flex;align-items:center;justify-content:center;
    font-size:${Math.round(size * 0.28)}px;font-weight:800;color:${P.ink};
    letter-spacing:-0.02em;
    font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;
    box-shadow:${baseShadow};
    transition:transform 0.16s ease-out,box-shadow 0.16s ease-out;
    user-select:none;
  `;
  if (first.profile_pic_url) {
    const img = document.createElement("img");
    img.src = first.profile_pic_url;
    img.loading = "lazy";
    img.decoding = "async";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;filter:grayscale(12%);";
    img.onerror = () => {
      img.remove();
      avatar.textContent = initials(first);
    };
    avatar.appendChild(img);
  } else {
    avatar.textContent = initials(first);
  }
  inner.appendChild(avatar);

  if (isCluster) {
    // Editorial postage-stamp counter: square purple chip, mono numerals.
    const badge = document.createElement("div");
    badge.style.cssText = `
      position:absolute;top:-6px;right:-6px;
      min-width:24px;height:20px;padding:0 5px;
      background:${P.purple};color:#fff;
      border:2px solid ${P.paper};
      border-radius:2px;
      display:flex;align-items:center;justify-content:center;
      font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
      font-size:11px;font-weight:800;
      font-variant-numeric:tabular-nums;letter-spacing:-0.01em;
      box-shadow:0 1px 3px rgba(15,23,42,0.45);
      pointer-events:none;
    `;
    badge.textContent = String(cluster.members.length);
    inner.appendChild(badge);
  }

  wrap.addEventListener("mouseenter", () => {
    cancelHide();
    populateCard(cluster, onNavigate);
    showCardAt(wrap);
    avatar.style.transform = "scale(1.12)";
    avatar.style.boxShadow = `0 8px 22px rgba(15,23,42,0.5),0 0 0 3px oklch(44% 0.26 294 / 0.35)`;
  });

  wrap.addEventListener("mouseleave", () => {
    hideCard(220);
    avatar.style.transform = "scale(1)";
    avatar.style.boxShadow = baseShadow;
  });

  wrap.addEventListener("click", () => {
    if (!isCluster) {
      onNavigate(first.slug);
      return;
    }
    // On touch devices (pointer: coarse), tap to toggle the card since hover doesn't fire.
    if (window.matchMedia("(pointer: coarse)").matches) {
      const { card } = getCard();
      const alreadyVisible = parseFloat(card.style.opacity) > 0;
      if (alreadyVisible) {
        hideCard(0);
      } else {
        populateCard(cluster, onNavigate);
        showCardAt(wrap);
      }
    }
  });

  return wrap;
}

// --------- map data ---------
const COUNTRY_URL = "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson";
const PROVINCE_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson";
const CITIES_URL = "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_populated_places_simple.geojson";

const GLOBE_IMG = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const BG_IMG = "https://unpkg.com/three-globe/example/img/night-sky.png";

interface LabelPoint {
  lat: number;
  lng: number;
  name: string;
  tier: "country" | "province" | "city";
  pop?: number;
}

type Tier = 0 | 1 | 2;
function altitudeToTier(alt: number): Tier {
  if (alt < 0.8) return 2;
  if (alt < 1.2) return 1;
  return 0;
}

const TRANSPARENT = () => "transparent";
const POLY_GEOM = (f: any) => f.geometry;
const LABEL_LAT_FN = (d: object) => (d as LabelPoint).lat;
const LABEL_LNG_FN = (d: object) => (d as LabelPoint).lng;
const LABEL_TEXT_FN = (d: object) => (d as LabelPoint).name;
const LABEL_SIZE_FN = (d: object) => {
  const t = (d as LabelPoint).tier;
  return t === "country" ? 0.55 : t === "province" ? 0.35 : 0.25;
};
const CLUSTER_LAT_FN = (c: object) => (c as PinCluster).latitude;
const CLUSTER_LNG_FN = (c: object) => (c as PinCluster).longitude;

function AlumniGlobeImpl({ pins, filteredPins }: AlumniGlobeProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const { resolvedTheme } = useTheme();
  const isDarkSky = resolvedTheme !== "light";

  const [size, setSize] = useState({ w: 800, h: 600 });
  const [tier, setTier] = useState<Tier>(0);
  const [countryFeatures, setCountryFeatures] = useState<any[]>([]);
  const [provinceFeatures, setProvinceFeatures] = useState<any[]>([]);
  const [countryLabels, setCountryLabels] = useState<LabelPoint[]>([]);
  const [provinceLabels, setProvinceLabels] = useState<LabelPoint[]>([]);
  const [cityLabels, setCityLabels] = useState<LabelPoint[]>([]);
  const [clusterPrecision, setClusterPrecision] = useState(2);
  const provincesLoadedRef = useRef(false);
  const citiesLoadedRef = useRef(false);
  const tierRef = useRef<Tier>(0);

  useEffect(() => {
    let cancelled = false;
    fetch(COUNTRY_URL).then((r) => r.json()).then((d) => {
      if (cancelled) return;
      const features = d.features ?? [];
      setCountryFeatures(features);
      setCountryLabels(
        features
          .filter((f: any) => f.properties?.LABEL_X != null && f.properties?.LABEL_Y != null)
          .map((f: any) => ({
            lat: f.properties.LABEL_Y,
            lng: f.properties.LABEL_X,
            name: f.properties.NAME ?? f.properties.ADMIN ?? "",
            tier: "country" as const,
          })),
      );
    });
    return () => { cancelled = true; };
  }, []);

  const loadProvinces = useCallback(() => {
    if (provincesLoadedRef.current) return;
    provincesLoadedRef.current = true;
    fetch(PROVINCE_URL).then((r) => r.json()).then((d) => {
      const features = d.features ?? [];
      setProvinceFeatures(features);
      setProvinceLabels(
        features
          .filter((f: any) => f.properties?.LABEL_X != null && f.properties?.LABEL_Y != null)
          .map((f: any) => ({
            lat: f.properties.LABEL_Y,
            lng: f.properties.LABEL_X,
            name: f.properties.name ?? f.properties.NAME ?? "",
            tier: "province" as const,
          })),
      );
    });
  }, []);

  const loadCities = useCallback(() => {
    if (citiesLoadedRef.current) return;
    citiesLoadedRef.current = true;
    fetch(CITIES_URL).then((r) => r.json()).then((d) => {
      setCityLabels(
        (d.features ?? [])
          .filter((f: any) => (f.properties?.pop_max ?? 0) > 300_000)
          .map((f: any) => ({
            lat: f.properties.latitude ?? f.geometry?.coordinates?.[1],
            lng: f.properties.longitude ?? f.geometry?.coordinates?.[0],
            name: f.properties.name ?? f.properties.NAME ?? "",
            tier: "city" as const,
            pop: f.properties.pop_max,
          })),
      );
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    let rafId = 0;
    let pending: { w: number; h: number } | null = null;
    const ro = new ResizeObserver(([e]) => {
      pending = { w: e.contentRect.width, h: e.contentRect.height };
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        if (pending) setSize(pending);
      });
    });
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);


  // Center the camera on Thailand once the globe has mounted. The Globe is
  // dynamically imported, so globeRef populates asynchronously and a one-shot
  // effect can fire before it exists — poll briefly until the instance is
  // ready, point at Thailand a single time, then stop.
  useEffect(() => {
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      const g = globeRef.current;
      if (g) {
        g.pointOfView({ lat: 15.87, lng: 100.99, altitude: 2.2 }, 0);
        clearInterval(id);
      } else if (tries > 100) {
        clearInterval(id);
      }
    }, 50);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();

    controls.autoRotate = false;

    // Render at a lower resolution while the user is actively dragging/zooming,
    // then restore full sharpness once the gesture settles. Re-rasterizing the
    // globe at native DPR every frame is what stalls weaker GPUs (notably
    // Windows via ANGLE/DirectX) during interaction; macOS/Metal hides the cost.
    // The render path goes through an EffectComposer, so both the renderer and
    // the composer's offscreen targets must be resized for it to take effect.
    const renderer = globeRef.current.renderer?.();
    const composer = globeRef.current.postProcessingComposer?.();
    const fullDpr = Math.min(2, window.devicePixelRatio);
    const dragDpr = Math.min(1, window.devicePixelRatio);
    const setDpr = (pr: number) => {
      renderer?.setPixelRatio(pr);
      composer?.setPixelRatio(pr);
    };
    const onStart = () => setDpr(dragDpr);
    const onEnd = () => setDpr(fullDpr);
    controls.addEventListener("start", onStart);
    controls.addEventListener("end", onEnd);

    let rafId = 0;
    let precisionTimer = 0;
    const handler = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const pov = globeRef.current?.pointOfView();
        if (!pov) return;
        const next = altitudeToTier(pov.altitude);
        if (next !== tierRef.current) {
          tierRef.current = next;
          if (next >= 1) loadProvinces();
          if (next >= 2) loadCities();
          setTier(next);
        }
        // Changing precision re-clusters and rebuilds every pin's DOM node, so
        // defer it until movement settles — otherwise the pins tear down and
        // rebuild mid-gesture and the drag visibly hitches.
        const precision = pov.altitude > 2 ? 0 : pov.altitude > 1 ? 1 : pov.altitude > 0.5 ? 2 : 4;
        if (precisionTimer) clearTimeout(precisionTimer);
        precisionTimer = window.setTimeout(() => setClusterPrecision(precision), 150);
      });
    };
    controls.addEventListener("change", handler);
    return () => {
      controls.removeEventListener("change", handler);
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
      if (rafId) cancelAnimationFrame(rafId);
      if (precisionTimer) clearTimeout(precisionTimer);
    };
  }, [loadProvinces, loadCities, size.w, size.h]);

  useEffect(() => {
    if (!globeRef.current) return;
    if (!filteredPins || filteredPins.length === 0) {
      if (filteredPins !== undefined) return;
      globeRef.current.controls().autoRotate = false;
      return;
    }
    const validPins = filteredPins.filter(hasValidGlobeCoords);
    if (validPins.length === 0) return;
    const lat = validPins.reduce((s, p) => s + p.latitude, 0) / validPins.length;
    const lng = validPins.reduce((s, p) => s + p.longitude, 0) / validPins.length;
    const alt = validPins.length === 1 ? 1.2 : validPins.length < 5 ? 1.8 : 2.5;
    globeRef.current.controls().autoRotate = false;
    globeRef.current.pointOfView({ lat, lng, altitude: alt }, 1200);
  }, [filteredPins]);

  const polygonsData = useMemo(
    () =>
      tier >= 1 && provinceFeatures.length > 0
        ? [...countryFeatures, ...provinceFeatures]
        : countryFeatures,
    [tier, countryFeatures, provinceFeatures],
  );

  const labelsData = useMemo<LabelPoint[]>(() => {
    if (tier === 0) return countryLabels;
    if (tier === 1) return [...countryLabels, ...provinceLabels];
    return [...countryLabels, ...provinceLabels, ...cityLabels];
  }, [tier, countryLabels, provinceLabels, cityLabels]);

  const displayPins = filteredPins !== undefined ? filteredPins : pins;
  const clusters = useMemo(() => clusterPins(displayPins, clusterPrecision), [displayPins, clusterPrecision]);

  const handleNavigate = useCallback((slug: string) => {
    routerRef.current.push(`/profile/${slug}`);
  }, []);

  const htmlElementFn = useCallback(
    (c: object) => makePinEl(c as PinCluster, handleNavigate),
    [handleNavigate],
  );

  const polygonStrokeColor = useCallback(
    (f: any) =>
      isDarkSky
        ? f.properties?.scalerank !== undefined
          ? "rgba(255,255,255,0.12)"
          : "rgba(255,255,255,0.25)"
        : f.properties?.scalerank !== undefined
          ? "rgba(15,23,42,0.18)"
          : "rgba(15,23,42,0.35)",
    [isDarkSky],
  );

  const labelColor = useCallback(
    (d: object) => {
      const t = (d as LabelPoint).tier;
      if (isDarkSky) {
        return t === "country"
          ? "rgba(255,255,255,0.85)"
          : t === "province"
            ? "rgba(255,255,255,0.55)"
            : "rgba(255,220,100,0.75)";
      }
      return t === "country"
        ? "rgba(15,23,42,0.9)"
        : t === "province"
          ? "rgba(15,23,42,0.6)"
          : "rgba(180,83,9,0.85)";
    },
    [isDarkSky],
  );

  return (
    <div ref={containerRef} className="relative w-full h-full isolate" style={{ zIndex: 0 }}>
      <Globe
        globeRef={globeRef}
        width={size.w}
        height={size.h}
        globeImageUrl={GLOBE_IMG}
        backgroundImageUrl={isDarkSky ? BG_IMG : null}
        backgroundColor={isDarkSky ? "#000000" : "#ffffff"}
        polygonsData={polygonsData}
        polygonGeoJsonGeometry={POLY_GEOM}
        polygonCapColor={TRANSPARENT}
        polygonSideColor={TRANSPARENT}
        polygonStrokeColor={polygonStrokeColor}
        polygonAltitude={0.001}
        labelsData={labelsData}
        labelLat={LABEL_LAT_FN}
        labelLng={LABEL_LNG_FN}
        labelText={LABEL_TEXT_FN}
        labelSize={LABEL_SIZE_FN}
        labelColor={labelColor}
        labelDotRadius={0}
        labelAltitude={0.002}
        labelResolution={2}
        htmlElementsData={clusters}
        htmlLat={CLUSTER_LAT_FN}
        htmlLng={CLUSTER_LNG_FN}
        htmlElement={htmlElementFn}
        atmosphereColor="#7c3aed"
        atmosphereAltitude={0.15}
      />
    </div>
  );
}

const AlumniGlobe = memo(AlumniGlobeImpl);
export default AlumniGlobe;

