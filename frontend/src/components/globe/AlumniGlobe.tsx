"use client";
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import type { GlobePin } from "@/lib/types";
import { useRouter } from "next/navigation";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

interface AlumniGlobeProps {
  pins: GlobePin[];
  filteredPins?: GlobePin[];
}

let globalCard: HTMLElement | null = null;

function getGlobalCard(): HTMLElement {
  if (globalCard && document.body.contains(globalCard)) return globalCard;

  const card = document.createElement("div");
  card.id = "__kvis_hover_card";
  card.style.cssText = `
    position:fixed;
    width:220px;
    background:rgba(2,8,28,0.97);
    backdrop-filter:blur(14px);
    border:1px solid rgba(59,130,246,0.4);
    border-radius:14px;
    padding:12px;
    pointer-events:none;
    opacity:0;
    transition:opacity 0.15s;
    box-shadow:0 8px 32px rgba(0,0,0,0.9);
    font-family:system-ui,sans-serif;
    z-index:99999;
    top:0;left:0;
    will-change:transform,opacity;
  `;
  document.body.appendChild(card);
  globalCard = card;
  return card;
}

function populateCard(card: HTMLElement, pin: GlobePin) {
  const initials = `${pin.first_name?.[0] ?? ""}${pin.last_name?.[0] ?? ""}`.toUpperCase();
  card.innerHTML = "";

  const topRow = document.createElement("div");
  topRow.style.cssText = "display:flex;align-items:center;gap:10px;margin-bottom:8px;";

  const av = document.createElement("div");
  av.style.cssText = `
    width:42px;height:42px;border-radius:50%;
    border:2px solid #3b82f6;background:#1e3a5f;overflow:hidden;
    flex-shrink:0;display:flex;align-items:center;justify-content:center;
    font-size:13px;font-weight:700;color:white;
  `;
  if (pin.profile_pic_url) {
    const img = document.createElement("img");
    img.src = pin.profile_pic_url;
    img.loading = "lazy";
    img.decoding = "async";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;";
    img.onerror = () => { img.remove(); av.textContent = initials; };
    av.appendChild(img);
  } else {
    av.textContent = initials;
  }

  const nameCol = document.createElement("div");
  nameCol.style.cssText = "min-width:0;";
  nameCol.innerHTML = `
    <div style="font-size:13px;font-weight:700;color:white;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
      ${pin.first_name} ${pin.last_name}
    </div>
    <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
      ${[pin.kvis_year ? `Gen ${pin.kvis_year}` : null, pin.country].filter(Boolean).join(" · ")}
    </div>
  `;

  topRow.appendChild(av);
  topRow.appendChild(nameCol);
  card.appendChild(topRow);

  const hr = document.createElement("div");
  hr.style.cssText = "height:1px;background:rgba(255,255,255,0.08);margin-bottom:8px;";
  card.appendChild(hr);

  if (pin.current_job) {
    const el = document.createElement("div");
    el.style.cssText = "font-size:11px;color:#cbd5e1;margin-bottom:5px;display:flex;align-items:flex-start;gap:5px;";
    const safe = pin.current_job.replace(/</g, "&lt;");
    el.innerHTML = `<span style="flex-shrink:0;">💼</span><span style="overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${safe}</span>`;
    card.appendChild(el);
  }

  if (pin.place) {
    const el = document.createElement("div");
    el.style.cssText = "font-size:11px;color:#cbd5e1;margin-bottom:5px;display:flex;align-items:center;gap:5px;";
    const safe = pin.place.replace(/</g, "&lt;");
    el.innerHTML = `<span>📍</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${safe}</span>`;
    card.appendChild(el);
  }

  if (pin.mbti) {
    const el = document.createElement("div");
    el.style.cssText = `
      display:inline-block;margin-top:4px;padding:2px 8px;border-radius:20px;
      background:rgba(59,130,246,0.2);border:1px solid rgba(59,130,246,0.4);
      font-size:10px;font-weight:700;color:#93c5fd;letter-spacing:0.05em;
    `;
    el.textContent = pin.mbti;
    card.appendChild(el);
  }
}

function makePinEl(pin: GlobePin, onClick: (id: number) => void): HTMLElement {
  const initials = `${pin.first_name?.[0] ?? ""}${pin.last_name?.[0] ?? ""}`.toUpperCase();

  const wrap = document.createElement("div");
  wrap.style.cssText = "cursor:pointer;display:flex;align-items:center;justify-content:center;pointer-events:auto;";

  const avatar = document.createElement("div");
  avatar.style.cssText = `
    width:54px;height:54px;border-radius:50%;
    border:3px solid #3b82f6;
    background:#1e3a5f;
    overflow:hidden;
    display:flex;align-items:center;justify-content:center;
    font-size:15px;font-weight:700;color:white;
    font-family:system-ui,sans-serif;
    box-shadow:0 3px 14px rgba(0,0,0,0.75);
    transition:transform 0.15s,border-color 0.15s,box-shadow 0.15s;
    user-select:none;
    will-change:transform;
  `;

  if (pin.profile_pic_url) {
    const img = document.createElement("img");
    img.src = pin.profile_pic_url;
    img.loading = "lazy";
    img.decoding = "async";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;";
    img.onerror = () => { img.remove(); avatar.textContent = initials; };
    avatar.appendChild(img);
  } else {
    avatar.textContent = initials;
  }

  wrap.addEventListener("mouseenter", () => {
    const card = getGlobalCard();
    populateCard(card, pin);

    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cardLeft = Math.max(8, Math.min(cx - 110, window.innerWidth - 228));

    card.style.left = `${cardLeft}px`;
    card.style.top = `${rect.top - 8}px`;
    card.style.transform = "translateY(-100%)";
    card.style.opacity = "1";

    avatar.style.transform = "scale(1.18)";
    avatar.style.borderColor = "#60a5fa";
    avatar.style.boxShadow = "0 0 18px rgba(96,165,250,0.6)";
  });

  wrap.addEventListener("mouseleave", () => {
    const card = getGlobalCard();
    card.style.opacity = "0";
    avatar.style.transform = "scale(1)";
    avatar.style.borderColor = "#3b82f6";
    avatar.style.boxShadow = "0 3px 14px rgba(0,0,0,0.75)";
  });

  wrap.addEventListener("click", () => onClick(pin.user_id));

  wrap.appendChild(avatar);
  return wrap;
}

const COUNTRY_URL = "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson";
const PROVINCE_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson";
const CITIES_URL = "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_populated_places_simple.geojson";

const GLOBE_IMG = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const BG_IMG = "https://unpkg.com/three-globe/example/img/night-sky.png";

interface LabelPoint { lat: number; lng: number; name: string; tier: "country" | "province" | "city"; pop?: number; }

type Tier = 0 | 1 | 2; // 0: country only, 1: + province, 2: + city
function altitudeToTier(alt: number): Tier {
  if (alt < 0.8) return 2;
  if (alt < 1.2) return 1;
  return 0;
}

export default function AlumniGlobe({ pins, filteredPins }: AlumniGlobeProps) {
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
  const provincesLoadedRef = useRef(false);
  const citiesLoadedRef = useRef(false);
  const tierRef = useRef<Tier>(0);

  useEffect(() => {
    let cancelled = false;
    fetch(COUNTRY_URL).then(r => r.json()).then(d => {
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
          }))
      );
    });
    return () => { cancelled = true; };
  }, []);

  const loadProvinces = useCallback(() => {
    if (provincesLoadedRef.current) return;
    provincesLoadedRef.current = true;
    fetch(PROVINCE_URL).then(r => r.json()).then(d => {
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
          }))
      );
    });
  }, []);

  const loadCities = useCallback(() => {
    if (citiesLoadedRef.current) return;
    citiesLoadedRef.current = true;
    fetch(CITIES_URL).then(r => r.json()).then(d => {
      setCityLabels(
        (d.features ?? [])
          .filter((f: any) => (f.properties?.pop_max ?? 0) > 300_000)
          .map((f: any) => ({
            lat: f.properties.latitude ?? f.geometry?.coordinates?.[1],
            lng: f.properties.longitude ?? f.geometry?.coordinates?.[0],
            name: f.properties.name ?? f.properties.NAME ?? "",
            tier: "city" as const,
            pop: f.properties.pop_max,
          }))
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
    return () => { ro.disconnect(); if (rafId) cancelAnimationFrame(rafId); };
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    let rafId = 0;
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
      });
    };
    controls.addEventListener("change", handler);
    return () => {
      controls.removeEventListener("change", handler);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [loadProvinces, loadCities]);

  useEffect(() => {
    if (!globeRef.current) return;
    if (!filteredPins || filteredPins.length === 0) {
      if (filteredPins !== undefined) return;
      globeRef.current.controls().autoRotate = true;
      return;
    }
    const lat = filteredPins.reduce((s, p) => s + p.latitude, 0) / filteredPins.length;
    const lng = filteredPins.reduce((s, p) => s + p.longitude, 0) / filteredPins.length;
    const alt = filteredPins.length === 1 ? 1.2 : filteredPins.length < 5 ? 1.8 : 2.5;
    globeRef.current.controls().autoRotate = false;
    globeRef.current.pointOfView({ lat, lng, altitude: alt }, 1200);
  }, [filteredPins]);

  const polygonsData = useMemo(
    () => (tier >= 1 && provinceFeatures.length > 0
      ? [...countryFeatures, ...provinceFeatures]
      : countryFeatures),
    [tier, countryFeatures, provinceFeatures],
  );

  const labelsData = useMemo<LabelPoint[]>(() => {
    if (tier === 0) return countryLabels;
    if (tier === 1) return [...countryLabels, ...provinceLabels];
    return [...countryLabels, ...provinceLabels, ...cityLabels];
  }, [tier, countryLabels, provinceLabels, cityLabels]);

  const displayPins = filteredPins !== undefined ? filteredPins : pins;

  const handlePinClick = useCallback((userId: number) => {
    routerRef.current.push(`/profile/${userId}`);
  }, []);

  const htmlElementFn = useCallback(
    (p: object) => makePinEl(p as GlobePin, handlePinClick),
    [handlePinClick],
  );

  return (
    <div ref={containerRef} className="w-full h-full">
      <Globe
        ref={globeRef}
        width={size.w}
        height={size.h}
        globeImageUrl={GLOBE_IMG}
        backgroundImageUrl={isDarkSky ? BG_IMG : null}
        backgroundColor={isDarkSky ? "#000000" : "#ffffff"}
        polygonsData={polygonsData}
        polygonGeoJsonGeometry={(f: any) => f.geometry}
        polygonCapColor={() => "transparent"}
        polygonSideColor={() => "transparent"}
        polygonStrokeColor={(f: any) =>
          isDarkSky
            ? (f.properties?.scalerank !== undefined
                ? "rgba(255,255,255,0.12)"
                : "rgba(255,255,255,0.25)")
            : (f.properties?.scalerank !== undefined
                ? "rgba(15,23,42,0.18)"
                : "rgba(15,23,42,0.35)")
        }
        polygonAltitude={0.001}
        labelsData={labelsData}
        labelLat={(d: object) => (d as LabelPoint).lat}
        labelLng={(d: object) => (d as LabelPoint).lng}
        labelText={(d: object) => (d as LabelPoint).name}
        labelSize={(d: object) => {
          const t = (d as LabelPoint).tier;
          return t === "country" ? 0.55 : t === "province" ? 0.35 : 0.25;
        }}
        labelColor={(d: object) => {
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
        }}
        labelDotRadius={0}
        labelAltitude={0.002}
        labelResolution={2}
        htmlElementsData={displayPins}
        htmlLat={(p: object) => (p as GlobePin).latitude}
        htmlLng={(p: object) => (p as GlobePin).longitude}
        htmlElement={htmlElementFn}
        atmosphereColor="#3b82f6"
        atmosphereAltitude={0.15}
      />
    </div>
  );
}
