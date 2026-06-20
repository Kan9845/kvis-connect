"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COUNTRIES } from "@/lib/constants/countries";

const BASE = "https://countriesnow.space/api/v0.1";

// Countries that are effectively a single city - no city selection needed.
export const CITY_STATE_COUNTRIES = new Set([
  "Singapore", "Monaco", "Vatican City", "San Marino", "Liechtenstein",
  "Maldives", "Bahrain", "Luxembourg", "Malta", "Andorra",
]);

// Countries that don't have states/provinces data from the API
const NO_STATES_COUNTRIES = new Set<string>([]);

let countriesCache: string[] | null = null;
const statesCache: Record<string, string[]> = {};
const citiesCache: Record<string, Record<string, string[]>> = {};

const LOCATION_NAME_OVERRIDES: Record<string, string> = {
  "city|Thailand|Bangkok|Parthum Wan": "Pathum Wan",
};

function normalizeLocationName(
  kind: "state" | "city",
  name: string,
  country: string,
  state?: string,
) {
  return (
    LOCATION_NAME_OVERRIDES[`${kind}|${country}|${state ?? ""}|${name}`] ??
    LOCATION_NAME_OVERRIDES[`${kind}|${country}|${name}`] ??
    name
  );
}

async function fetchCountries(): Promise<string[]> {
  if (countriesCache) return countriesCache;
  countriesCache = COUNTRIES.map((c) => c.label).sort();
  return countriesCache;
}

async function fetchStates(country: string): Promise<string[]> {
  if (statesCache[country]) return statesCache[country];
  try {
    const res = await fetch(`${BASE}/countries/states/q?country=${encodeURIComponent(country)}`);
    const json = await res.json();
    if (json.error || !json.data?.states) {
      statesCache[country] = [];
      return [];
    }
    const states: string[] = (json.data.states as { name: string }[])
      .map((s) => normalizeLocationName("state", s.name, country))
      .sort();
    statesCache[country] = states;
    return states;
  } catch {
    statesCache[country] = [];
    return [];
  }
}

async function fetchCities(country: string, state?: string): Promise<string[]> {
  const cacheKey = state ? `${country}|${state}` : country;
  if (citiesCache[country]?.[cacheKey]) return citiesCache[country][cacheKey];

  try {
    const res = state
      ? await fetch(`${BASE}/countries/state/cities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country, state }),
        })
      : await fetch(`${BASE}/countries/cities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country }),
        });
    const json = await res.json();
    const cities: string[] = json.error ? [] : (json.data as string[])
      .map((city) => normalizeLocationName("city", city, country, state))
      .sort();

    if (!citiesCache[country]) citiesCache[country] = {};
    citiesCache[country][cacheKey] = cities;
    return cities;
  } catch {
    if (!citiesCache[country]) citiesCache[country] = {};
    citiesCache[country][cacheKey] = [];
    return [];
  }
}

// ── CountrySelect ─────────────────────────────────────────────────────────────
interface CountrySelectProps {
  value: string;
  onChange: (v: string) => void;
  borderColor?: string;
  variant?: "bordered" | "underline";
  className?: string;
}

export function CountrySelect({ value, onChange, borderColor, variant = "bordered", className }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    fetchCountries().then(setCountries);
  }, []);

  const filtered = query.trim()
    ? countries.filter((c) => c.toLowerCase().includes(query.toLowerCase())).slice(0, 40)
    : countries.slice(0, 40);

  const triggerCls = cn(
    variant === "underline"
      ? "w-full border-0 border-b px-0 py-2 flex items-center justify-between text-sm transition-colors bg-transparent"
      : "w-full h-9 border rounded-md px-3 flex items-center justify-between text-sm transition-colors bg-transparent",
    className
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={triggerCls}
          style={{ borderColor: variant === "bordered" ? (borderColor ?? "var(--sep-input)") : "var(--sep-input)" }}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={cn(value ? "text-foreground" : "text-foreground/40")}>
            {value || "Select country..."}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-40 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-md" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search country..." value={query} onValueChange={setQuery} />
          <CommandList className="max-h-60">
            {filtered.length === 0
              ? <CommandEmpty>No match</CommandEmpty>
              : <CommandGroup>
                  <CommandItem value="" onSelect={() => { onChange(""); setOpen(false); setQuery(""); }}>
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", !value ? "opacity-100" : "opacity-0")} />
                    Any country
                  </CommandItem>
                  {filtered.map((c) => (
                    <CommandItem key={c} value={c} onSelect={() => { onChange(value === c ? "" : c); setOpen(false); setQuery(""); }}>
                      <Check className={cn("mr-2 h-4 w-4 shrink-0", value === c ? "opacity-100" : "opacity-0")} />
                      {c}
                    </CommandItem>
                  ))}
                </CommandGroup>
            }
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── ProvinceSelect ───────────────────────────────────────────────────────────
interface ProvinceSelectProps {
  country: string;
  value: string;
  onChange: (v: string) => void;
  borderColor?: string;
  variant?: "bordered" | "underline";
  className?: string;
}

export function ProvinceSelect({ country, value, onChange, borderColor, variant = "bordered", className }: ProvinceSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualText, setManualText] = useState("");
  const loadedFor = useRef("");

  useEffect(() => {
    if (!country || loadedFor.current === country) return;
    loadedFor.current = country;
    setStates([]);
    setLoading(true);
    fetchStates(country).then((s) => { setStates(s); setLoading(false); });
  }, [country]);

  // Reset manual mode when country changes
  useEffect(() => {
    setManualMode(false);
    setManualText("");
  }, [country]);

  // Hide if city-state country or no states available
  if (country && (CITY_STATE_COUNTRIES.has(country) || NO_STATES_COUNTRIES.has(country))) return null;

  const disabled = !country;
  const placeholder = !country
    ? "Select country first"
    : loading
    ? "Loading provinces..."
    : "Select province / state...";

  const filtered = query.trim()
    ? states.filter((s) => s.toLowerCase().includes(query.toLowerCase())).slice(0, 40)
    : states.slice(0, 40);

  function enterManual() {
    setManualText(value && !states.includes(value) ? value : "");
    setManualMode(true);
    setOpen(false);
  }

  const triggerCls = cn(
    variant === "underline"
      ? "w-full border-0 border-b px-0 py-2 flex items-center justify-between text-sm transition-colors bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      : "w-full h-9 border rounded-md px-3 flex items-center justify-between text-sm transition-colors bg-transparent disabled:opacity-50 disabled:cursor-not-allowed",
    className
  );

  const manualInputCls = variant === "underline"
    ? "w-full bg-transparent border-0 border-b rounded-none px-0 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors"
    : "w-full h-12 border px-4 text-[15px] bg-transparent outline-none focus:outline-none";

  if (manualMode) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Enter province / state"
          value={manualText}
          onChange={(e) => { setManualText(e.target.value); onChange(e.target.value); }}
          autoFocus
          className={manualInputCls}
          style={variant === "bordered" ? { borderColor } : undefined}
          onFocus={variant === "bordered" ? (e) => (e.currentTarget.style.borderColor = "oklch(78% 0.01 294)") : undefined}
          onBlur={variant === "bordered" ? (e) => (e.currentTarget.style.borderColor = borderColor ?? "") : undefined}
        />
        <button
          type="button"
          onClick={() => { setManualMode(false); setQuery(""); }}
          className="text-xs text-muted-foreground underline underline-offset-2"
        >
          Search list instead
        </button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={(v) => { if (!disabled) setOpen(v); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={triggerCls}
          style={{ borderColor: variant === "bordered" ? (borderColor ?? "var(--sep-input)") : "var(--sep-input)" }}
          onClick={() => { if (!disabled) setOpen((o) => !o); }}
        >
          <span className={cn(value ? "text-foreground" : "text-foreground/40")}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-40 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-md" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search province..." value={query} onValueChange={setQuery} />
          <CommandList className="max-h-60">
            {loading ? (
              <div className="py-5 text-center text-xs text-muted-foreground">Loading provinces...</div>
            ) : filtered.length === 0 ? (
              <CommandEmpty>
                No match -{" "}
                <button type="button" className="underline" onClick={enterManual}>
                  enter manually
                </button>
              </CommandEmpty>
            ) : (
              <CommandGroup>
                <CommandItem value="" onSelect={() => { onChange(""); setOpen(false); setQuery(""); }}>
                  <Check className={cn("mr-2 h-4 w-4 shrink-0", !value ? "opacity-100" : "opacity-0")} />
                  Any province
                </CommandItem>
                {filtered.map((s) => (
                  <CommandItem key={s} value={s} onSelect={() => { onChange(value === s ? "" : s); setOpen(false); setQuery(""); }}>
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", value === s ? "opacity-100" : "opacity-0")} />
                    {s}
                  </CommandItem>
                ))}
                <CommandItem value="__other__" onSelect={enterManual} className="italic text-muted-foreground">
                  <span className="ml-6">Not listed - enter manually</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── CitySelect ────────────────────────────────────────────────────────────────
interface CitySelectProps {
  country: string;
  province?: string;
  value: string;
  onChange: (v: string) => void;
  borderColor?: string;
  variant?: "bordered" | "underline";
  className?: string;
}

export function CitySelect({ country, province, value, onChange, borderColor, variant = "bordered", className }: CitySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualText, setManualText] = useState("");
  const loadedFor = useRef("");

  useEffect(() => {
    // Determine dependency: use province if available, otherwise country
    const dependency = province || country;
    if (!dependency || loadedFor.current === dependency) return;
    loadedFor.current = dependency;
    setCities([]);
    setLoading(true);
    fetchCities(country, province).then((c) => { setCities(c); setLoading(false); });
  }, [country, province]);

  // Reset manual mode when country/province changes
  useEffect(() => {
    setManualMode(false);
    setManualText("");
  }, [country, province]);

  if (country && CITY_STATE_COUNTRIES.has(country)) return null;

  // Disable if no province selected (when provinces are available) or no country
  const hasSeparateProvinces = country && !CITY_STATE_COUNTRIES.has(country) && !NO_STATES_COUNTRIES.has(country);
  const disabled = hasSeparateProvinces ? !province : !country;

  const placeholder = !country
    ? "Select country first"
    : hasSeparateProvinces && !province
    ? "Select province first"
    : loading
    ? "Loading cities..."
    : "Select city...";

  const filtered = query.trim()
    ? cities.filter((c) => c.toLowerCase().includes(query.toLowerCase())).slice(0, 40)
    : cities.slice(0, 40);

  function enterManual() {
    setManualText(value && !cities.includes(value) ? value : "");
    setManualMode(true);
    setOpen(false);
  }

  const triggerCls = cn(
    variant === "underline"
      ? "w-full border-0 border-b px-0 py-2 flex items-center justify-between text-sm transition-colors bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      : "w-full h-9 border rounded-md px-3 flex items-center justify-between text-sm transition-colors bg-transparent disabled:opacity-50 disabled:cursor-not-allowed",
    className
  );

  const manualInputCls = variant === "underline"
    ? "w-full bg-transparent border-0 border-b rounded-none px-0 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors"
    : "w-full h-12 border px-4 text-[15px] bg-transparent outline-none focus:outline-none";

  if (manualMode) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Enter city / province"
          value={manualText}
          onChange={(e) => { setManualText(e.target.value); onChange(e.target.value); }}
          autoFocus
          className={manualInputCls}
          style={variant === "bordered" ? { borderColor } : undefined}
          onFocus={variant === "bordered" ? (e) => (e.currentTarget.style.borderColor = "oklch(78% 0.01 294)") : undefined}
          onBlur={variant === "bordered" ? (e) => (e.currentTarget.style.borderColor = borderColor ?? "") : undefined}
        />
        <button
          type="button"
          onClick={() => { setManualMode(false); setQuery(""); }}
          className="text-xs text-muted-foreground underline underline-offset-2"
        >
          Search list instead
        </button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={(v) => { if (!disabled) setOpen(v); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={triggerCls}
          style={{ borderColor: variant === "bordered" ? (borderColor ?? "var(--sep-input)") : "var(--sep-input)" }}
          onClick={() => { if (!disabled) setOpen((o) => !o); }}
        >
          <span className={cn(value ? "text-foreground" : "text-foreground/40")}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-40 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-md" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={hasSeparateProvinces && !province ? "Select province first" : "Search city..."} value={query} onValueChange={setQuery} disabled={hasSeparateProvinces && !province ? true : undefined} />
          <CommandList className="max-h-60">
            {loading ? (
              <div className="py-5 text-center text-xs text-muted-foreground">Loading cities...</div>
            ) : filtered.length === 0 ? (
              <CommandEmpty>
                No match -{" "}
                <button type="button" className="underline" onClick={enterManual}>
                  enter manually
                </button>
              </CommandEmpty>
            ) : (
              <CommandGroup>
                <CommandItem value="" onSelect={() => { onChange(""); setOpen(false); setQuery(""); }}>
                  <Check className={cn("mr-2 h-4 w-4 shrink-0", !value ? "opacity-100" : "opacity-0")} />
                  Any city
                </CommandItem>
                {filtered.map((c) => (
                  <CommandItem key={c} value={c} onSelect={() => { onChange(value === c ? "" : c); setOpen(false); setQuery(""); }}>
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", value === c ? "opacity-100" : "opacity-0")} />
                    {c}
                  </CommandItem>
                ))}
                <CommandItem value="__other__" onSelect={enterManual} className="italic text-muted-foreground">
                  <span className="ml-6">Not listed - enter manually</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

