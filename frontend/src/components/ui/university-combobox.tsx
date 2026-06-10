"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface UniEntry { name: string; country: string; }

// Universities missing from the Hipolabs dataset
const SUPPLEMENTAL: UniEntry[] = [
  { name: "VISTEC", country: "Thailand" },
  { name: "Mahidol University International College", country: "Thailand" },
  { name: "King Mongkut's University of Technology Thonburi", country: "Thailand" },
  { name: "King Mongkut's Institute of Technology Ladkrabang", country: "Thailand" },
  { name: "Asian Institute of Technology", country: "Thailand" },
];

let cachedData: UniEntry[] | null = null;

async function loadUniversities(): Promise<UniEntry[]> {
  if (cachedData) return cachedData;
  const res = await fetch("/universities.json");
  const data: UniEntry[] = await res.json();
  // Merge supplemental, dedup by name
  const names = new Set(data.map((u) => u.name));
  cachedData = [
    ...SUPPLEMENTAL.filter((u) => !names.has(u.name)),
    ...data,
  ];
  return cachedData;
}

const OTHER_SENTINEL = "__other__";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onCountryChange?: (country: string) => void;
  placeholder?: string;
  inputBorderColor?: string;
  variant?: "bordered" | "underline";
  className?: string;
}

export function UniversityCombobox({ value, onChange, onCountryChange, placeholder = "Search university…", inputBorderColor, variant = "bordered", className }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UniEntry[]>([]);
  const [otherMode, setOtherMode] = useState(false);
  const [otherText, setOtherText] = useState("");
  const allData = useRef<UniEntry[]>([]);

  useEffect(() => {
    loadUniversities().then((data) => { allData.current = data; });
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) { setResults([]); return; }
    setResults(
      allData.current.filter((u) => u.name.toLowerCase().includes(q)).slice(0, 30)
    );
  }, [query]);

  // If entering other mode, pre-fill text with current value if it was custom
  function enterOtherMode() {
    setOtherText(value && value !== OTHER_SENTINEL ? value : "");
    setOtherMode(true);
    setOpen(false);
  }

  const triggerCls = cn(
    variant === "underline"
      ? "w-full border-0 border-b px-0 py-2 flex items-center justify-between text-sm transition-colors bg-transparent"
      : "w-full h-9 border rounded-md px-3 flex items-center justify-between text-sm transition-colors bg-transparent",
    className
  );

  const manualInputCls = variant === "underline"
    ? "w-full bg-transparent border-0 border-b rounded-none px-0 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors"
    : "w-full h-9 border rounded-md px-3 text-sm bg-transparent outline-none focus:outline-none";

  if (otherMode) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Enter university name"
          value={otherText}
          onChange={(e) => {
            setOtherText(e.target.value);
            onChange(e.target.value);
          }}
          autoFocus
          className={manualInputCls}
          style={variant === "bordered" ? { borderColor: inputBorderColor } : undefined}
          onFocus={variant === "bordered" ? (e) => (e.currentTarget.style.borderColor = "oklch(78% 0.01 294)") : undefined}
          onBlur={variant === "bordered" ? (e) => (e.currentTarget.style.borderColor = inputBorderColor ?? "") : undefined}
        />
        <button
          type="button"
          onClick={() => { setOtherMode(false); setQuery(""); }}
          className="text-xs text-muted-foreground underline underline-offset-2"
        >
          Search list instead
        </button>
      </div>
    );
  }

  const displayValue = value && value !== OTHER_SENTINEL ? value : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={triggerCls}
          style={{ borderColor: variant === "bordered" ? (inputBorderColor ?? "var(--sep-input)") : "var(--sep-input)" }}
        >
          <span className={cn(displayValue ? "text-foreground" : "text-foreground/40")}>
            {displayValue || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-40 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-md" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type at least 2 characters…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-60">
            {query.trim().length < 2 ? (
              <div className="py-5 text-center text-xs text-muted-foreground">Start typing to search</div>
            ) : results.length === 0 ? (
              <CommandEmpty>
                No match -{" "}
                <button type="button" className="underline" onClick={enterOtherMode}>
                  enter manually
                </button>
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((u) => (
                  <CommandItem
                    key={u.name}
                    value={u.name}
                    onSelect={() => {
                      onChange(u.name);
                      onCountryChange?.(u.country);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", value === u.name ? "opacity-100" : "opacity-0")} />
                    <span className="flex-1 truncate">{u.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground shrink-0">{u.country}</span>
                  </CommandItem>
                ))}
                <CommandItem
                  value={OTHER_SENTINEL}
                  onSelect={enterOtherMode}
                  className="italic text-muted-foreground"
                >
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
