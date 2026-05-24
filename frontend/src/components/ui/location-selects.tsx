"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const BASE = "https://countriesnow.space/api/v0.1";

// Countries that are effectively a single city — no city selection needed.
export const CITY_STATE_COUNTRIES = new Set([
  "Singapore", "Monaco", "Vatican City", "San Marino", "Liechtenstein",
  "Maldives", "Bahrain", "Luxembourg", "Malta", "Andorra",
]);

let countriesCache: string[] | null = null;
const citiesCache: Record<string, string[]> = {};

async function fetchCountries(): Promise<string[]> {
  if (countriesCache) return countriesCache;
  const res = await fetch(`${BASE}/countries/iso`);
  const json = await res.json();
  countriesCache = (json.data as { name: string }[])
    .map((c) => c.name)
    .sort();
  return countriesCache!;
}

async function fetchCities(country: string): Promise<string[]> {
  if (citiesCache[country]) return citiesCache[country];
  const apiCountry = country;
  const res = await fetch(`${BASE}/countries/cities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country: apiCountry }),
  });
  const json = await res.json();
  const cities: string[] = json.error ? [] : (json.data as string[]).sort();
  citiesCache[country] = cities;
  return cities;
}

// ── CountrySelect ─────────────────────────────────────────────────────────────
interface CountrySelectProps {
  value: string;
  onChange: (v: string) => void;
  borderColor?: string;
  variant?: "bordered" | "underline";
}

export function CountrySelect({ value, onChange, borderColor, variant = "bordered" }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    fetchCountries().then(setCountries);
  }, []);

  const filtered = query.trim()
    ? countries.filter((c) => c.toLowerCase().includes(query.toLowerCase())).slice(0, 40)
    : countries.slice(0, 40);

  const triggerCls = variant === "underline"
    ? "w-full border-0 border-b border-foreground/20 px-0 py-2 flex items-center justify-between text-sm md:text-base transition-colors bg-transparent"
    : "w-full h-12 border px-4 flex items-center justify-between text-[15px] transition-colors";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={triggerCls}
          style={variant === "bordered" ? { borderColor, background: "transparent" } : undefined}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={cn(value ? "text-foreground" : "text-foreground/25")}>
            {value || "Select country..."}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-40 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-none" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search country..." value={query} onValueChange={setQuery} />
          <CommandList className="max-h-60">
            {filtered.length === 0
              ? <CommandEmpty>No match</CommandEmpty>
              : <CommandGroup>
                  {filtered.map((c) => (
                    <CommandItem key={c} value={c} onSelect={() => { onChange(c); setOpen(false); setQuery(""); }}>
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

// ── CitySelect ────────────────────────────────────────────────────────────────
interface CitySelectProps {
  country: string;
  value: string;
  onChange: (v: string) => void;
  borderColor?: string;
  variant?: "bordered" | "underline";
}

export function CitySelect({ country, value, onChange, borderColor, variant = "bordered" }: CitySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualText, setManualText] = useState("");
  const loadedFor = useRef("");

  useEffect(() => {
    if (!country || loadedFor.current === country) return;
    loadedFor.current = country;
    setCities([]);
    setLoading(true);
    fetchCities(country).then((c) => { setCities(c); setLoading(false); });
  }, [country]);

  // Reset manual mode when country changes
  useEffect(() => {
    setManualMode(false);
    setManualText("");
  }, [country]);

  if (country && CITY_STATE_COUNTRIES.has(country)) return null;

  const disabled = !country;
  const placeholder = !country
    ? "Select country first"
    : loading
    ? "Loading cities..."
    : "Select city / province...";

  const filtered = query.trim()
    ? cities.filter((c) => c.toLowerCase().includes(query.toLowerCase())).slice(0, 40)
    : cities.slice(0, 40);

  function enterManual() {
    setManualText(value && !cities.includes(value) ? value : "");
    setManualMode(true);
    setOpen(false);
  }

  const triggerCls = variant === "underline"
    ? "w-full border-0 border-b border-foreground/20 px-0 py-2 flex items-center justify-between text-sm md:text-base transition-colors bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
    : "w-full h-12 border px-4 flex items-center justify-between text-[15px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const manualInputCls = variant === "underline"
    ? "w-full bg-transparent border-0 border-b border-foreground/20 rounded-none px-0 py-2 text-sm md:text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors"
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
          style={variant === "bordered" ? { borderColor, background: "transparent" } : undefined}
          onClick={() => { if (!disabled) setOpen((o) => !o); }}
        >
          <span className={cn(value ? "text-foreground" : "text-foreground/25")}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-40 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-none" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search city..." value={query} onValueChange={setQuery} />
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
                {filtered.map((c) => (
                  <CommandItem key={c} value={c} onSelect={() => { onChange(c); setOpen(false); setQuery(""); }}>
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
