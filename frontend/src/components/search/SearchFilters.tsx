"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { searchApi } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from "react";
import { Check, ChevronDown, ChevronsUpDown, X } from "lucide-react";
import { DEGREES, FIELDS_OF_STUDY, KVIS_YEARS, ROLE_TYPES, SCHOLARSHIP_OPTIONS } from "@/lib/constants/options";
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CountrySelect, ProvinceSelect, CitySelect, CITY_STATE_COUNTRIES } from "@/components/ui/location-selects";
import { UniversityCombobox } from "@/components/ui/university-combobox";
import { MajorCombobox } from "@/components/ui/major-combobox";
import type { SearchParams } from "@/lib/types";
import { cn } from "@/lib/utils";
import { INDUSTRY_SECTORS } from "@/app/profile/edit/constants";


interface Props {
  values: SearchParams;
  onChange: (params: SearchParams) => void;
  dark?: boolean;
  forceSectionsClosed?: boolean;
  measureOnly?: boolean;
  onHeightChange?: (height: number) => void;
}

function Section({
  title,
  children,
  defaultOpen = false,
  dark = false,
  hasValue = false,
  forceClosed = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  dark?: boolean;
  hasValue?: boolean;
  forceClosed?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = forceClosed ? false : open;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (!forceClosed) setOpen((o) => !o);
        }}
        className={cn(
          "flex items-center justify-between w-full text-sm font-medium py-2.5 transition-colors",
          dark ? "text-white/90 hover:text-white" : "text-foreground hover:text-foreground/70"
        )}
      >
        <span className="flex items-center gap-2">
          {title}
          {hasValue && (
            <span
              className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: "var(--kvis-purple)" }}
            />
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            dark ? "text-white/40" : "text-muted-foreground",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="space-y-2 pb-3 pt-0.5">{children}</div>
        </div>
      </div>
    </div>
  );
}


function OptionsCombobox({ value, onChange, options, placeholder, triggerCls }: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder: string;
  triggerCls?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : [...options];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full h-9 border rounded-md px-3 flex items-center justify-between text-sm", triggerCls)}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={cn("truncate min-w-0", !value && "opacity-40")}>{value || placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-40 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-md" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search..." value={query} onValueChange={setQuery} />
          <CommandList className="max-h-60">
            {filtered.length === 0 ? (
              <CommandEmpty>No match</CommandEmpty>
            ) : (
              <CommandGroup>
                <CommandItem value="" onSelect={() => { onChange(""); setOpen(false); setQuery(""); }}>
                  <Check className={cn("mr-2 h-4 w-4 shrink-0", !value ? "opacity-100" : "opacity-0")} />
                  Any
                </CommandItem>
                {filtered.map((o) => (
                  <CommandItem key={o} value={o} onSelect={() => { onChange(value === o ? "" : o); setOpen(false); setQuery(""); }}>
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", value === o ? "opacity-100" : "opacity-0")} />
                    {o}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function AsyncCombobox({ field, value, onChange, placeholder, triggerCls }: {
  field: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  triggerCls?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOptions = useCallback((q: string) => {
    searchApi.autocomplete(field, q).then(setOptions).catch(() => {});
  }, [field]);

  useEffect(() => {
    if (!open) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchOptions(query), 200);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, open, fetchOptions]);

  useEffect(() => {
    if (open) fetchOptions(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full h-9 border rounded-md px-3 flex items-center justify-between text-sm", triggerCls)}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={cn("truncate min-w-0", !value && "opacity-40")}>{value || placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-40 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-md" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search..." value={query} onValueChange={setQuery} />
          <CommandList className="max-h-60">
            {options.length === 0 ? (
              <CommandEmpty>No results</CommandEmpty>
            ) : (
              <CommandGroup>
                <CommandItem value="" onSelect={() => { onChange(""); setOpen(false); setQuery(""); }}>
                  <Check className={cn("mr-2 h-4 w-4 shrink-0", !value ? "opacity-100" : "opacity-0")} />
                  Any
                </CommandItem>
                {options.map((o) => (
                  <CommandItem key={o} value={o} onSelect={() => { onChange(value === o ? "" : o); setOpen(false); setQuery(""); }}>
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", value === o ? "opacity-100" : "opacity-0")} />
                    {o}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function SearchFilters({
  values,
  onChange,
  dark = false,
  forceSectionsClosed = false,
  measureOnly = false,
  onHeightChange,
}: Props) {
  const { register, reset, setValue, watch, getValues } = useForm<SearchParams>({ defaultValues: values });
  const formValues = watch();
  const serialized = JSON.stringify(formValues);
  const externalRef = useRef(JSON.stringify(values));
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onHeightChange || !rootRef.current) return;

    const update = () =>
      onHeightChange(rootRef.current?.getBoundingClientRect().height ?? 0);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(rootRef.current);

    return () => observer.disconnect();
  }, [onHeightChange, serialized, forceSectionsClosed]);

  // Sync form when parent searchParams change (e.g. other panel instance updated them)
  useEffect(() => {
    const incoming = JSON.stringify(values);
    if (incoming !== externalRef.current) {
      externalRef.current = incoming;
      reset(values);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  useEffect(() => {
    if (measureOnly) return;

    const t = setTimeout(() => {
      // Read live form values (not the stale effect closure) so a reset()
      // triggered by the sibling panel instance can't re-emit an old filter.
      const clean = Object.fromEntries(
        Object.entries(getValues()).filter(([, v]) => v !== "" && v !== undefined && v !== null)
      ) as SearchParams;
      const cleanStr = JSON.stringify(clean);
      if (cleanStr !== externalRef.current) {
        externalRef.current = cleanStr;
        onChange(clean);
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  const handleClear = () => {
    externalRef.current = "{}";
    reset(Object.fromEntries(Object.keys(getValues()).map((k) => [k, ""])) as SearchParams);
    onChange({});
  };

  const hasAny = Object.values(formValues).some((v) => v !== "" && v !== undefined && v !== null);

  const inputCls = dark
    ? "h-9 rounded-md bg-white/5 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/20 focus-visible:border-white/50"
    : "h-9 rounded-md border-[var(--sep-input)] focus-visible:border-[var(--sep-input-focus)]";

  const triggerCls = dark
    ? "h-9 rounded-md bg-white/5 border-white/20 text-white [&_svg]:text-white/40"
    : "h-9 rounded-md border-[var(--sep-input)]";

  const selectCls = (val: string | undefined) => dark
    ? `h-9 rounded-md bg-white/5 border-white/20 [&_svg]:text-white/40 ${val ? "text-white" : "text-white/40"}`
    : `h-9 rounded-md border-[var(--sep-input)] ${val ? "" : "[&>span]:opacity-40"}`;

  const comboCls = dark
    ? "bg-white/5 border-white/20 text-white"
    : "";

  const dividerCls = dark ? "bg-white/10" : "bg-[var(--kvis-rule)]";

  return (
    <div ref={rootRef} className="space-y-0.5">
      {/* Name - always visible */}
      <div className="pb-3">
        <span className={cn("block text-xs font-medium mb-1.5", dark ? "text-white/50" : "text-muted-foreground")}>
          Name
        </span>
        <Input placeholder="Search by name..." {...register("name")} className={inputCls} />
      </div>

      <div className={cn("h-px", dividerCls)} />

      <Section
        title="KVIS Batch"
        dark={dark}
        hasValue={!!formValues.kvis_year}
        forceClosed={forceSectionsClosed}
      >
        <Select value={formValues.kvis_year ? String(formValues.kvis_year) : "__any__"} onValueChange={(v) => setValue("kvis_year", v && v !== "__any__" ? parseInt(v) : undefined)}>
          <SelectTrigger className={selectCls(formValues.kvis_year?.toString())}>
            <SelectValue placeholder="Any batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any__">Any batch</SelectItem>
            {KVIS_YEARS.map((y) => (
              <SelectItem key={y.value} value={String(y.value)}>{y.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      <div className={cn("h-px", dividerCls)} />

      <Section
        title="Location"
        dark={dark}
        hasValue={!!(formValues.country || formValues.place_level2 || formValues.place)}
        forceClosed={forceSectionsClosed}
      >
        <div className="space-y-2">
          <CountrySelect
            value={formValues.country ?? ""}
            className={comboCls}
            onChange={(v) => {
              setValue("country", v || undefined);
              setValue("place_level2", undefined);
              setValue("place", undefined);
            }}
          />
          {formValues.country && (
            <ProvinceSelect
              country={formValues.country}
              value={formValues.place_level2 ?? ""}
              className={comboCls}
              onChange={(v) => {
                setValue("place_level2", v || undefined);
                setValue("place", undefined);
              }}
            />
          )}
          {formValues.country && !CITY_STATE_COUNTRIES.has(formValues.country) && (
            <CitySelect
              country={formValues.country}
              province={formValues.place_level2 ?? ""}
              value={formValues.place ?? ""}
              className={comboCls}
              onChange={(v) => setValue("place", v || undefined)}
            />
          )}
        </div>
      </Section>

      <div className={cn("h-px", dividerCls)} />

      <Section
        title="Education"
        dark={dark}
        hasValue={!!(formValues.uni_name || formValues.degree || formValues.field_of_study || formValues.major || formValues.scholarship)}
        forceClosed={forceSectionsClosed}
      >
        <div className="space-y-2">
          <UniversityCombobox
            value={formValues.uni_name ?? ""}
            className={dark ? "bg-white/5 border-white/20 text-white" : ""}
            onChange={(v) => setValue("uni_name", v || undefined)}
            placeholder="Search university..."
          />
          <Select value={formValues.degree || "__any__"} onValueChange={(v) => setValue("degree", v && v !== "__any__" ? v : undefined)}>
            <SelectTrigger className={selectCls(formValues.degree)}>
              <SelectValue placeholder="Any degree" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any degree</SelectItem>
              {DEGREES.map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={formValues.field_of_study || "__any__"} onValueChange={(v) => setValue("field_of_study", v && v !== "__any__" ? v : undefined)}>
            <SelectTrigger className={selectCls(formValues.field_of_study)}>
              <SelectValue placeholder="Any field of study" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any field of study</SelectItem>
              {FIELDS_OF_STUDY.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <MajorCombobox
            value={formValues.major ?? ""}
            className={comboCls}
            onChange={(v) => setValue("major", v || undefined)}
          />
          <OptionsCombobox
            value={formValues.scholarship ?? ""}
            onChange={(v) => setValue("scholarship", v || undefined)}
            options={SCHOLARSHIP_OPTIONS}
            placeholder="Any scholarship"
            triggerCls={triggerCls}
          />
        </div>
      </Section>

      <div className={cn("h-px", dividerCls)} />

      <Section
        title="Career"
        dark={dark}
        hasValue={!!(formValues.job_title || formValues.employer || formValues.industry_sector || formValues.role_type)}
        forceClosed={forceSectionsClosed}
      >
        <div className="space-y-2">
          <AsyncCombobox field="job_title" value={formValues.job_title ?? ""} onChange={(v) => setValue("job_title", v || undefined)} placeholder="Job title" triggerCls={triggerCls} />
          <AsyncCombobox field="employer" value={formValues.employer ?? ""} onChange={(v) => setValue("employer", v || undefined)} placeholder="Employer" triggerCls={triggerCls} />
          <Select value={formValues.industry_sector || "__any__"} 
            onValueChange={(v) => setValue("industry_sector", v && v !== "__any__" ? v : undefined)}>
            <SelectTrigger className={selectCls(formValues.industry_sector)}>
              <SelectValue placeholder="Any industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any industry</SelectItem>
              {INDUSTRY_SECTORS.map((g, index) => (
                <React.Fragment key={g.group}>
                  {index > 0 && <SelectSeparator />}
                  <SelectGroup>
                    <SelectLabel>{g.group}</SelectLabel>
                    {g.options.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectGroup>
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
          <OptionsCombobox
            value={formValues.role_type ?? ""}
            onChange={(v) => setValue("role_type", v || undefined)}
            options={ROLE_TYPES}
            placeholder="Any role type"
            triggerCls={triggerCls}
          />
        </div>
      </Section>

      {hasAny && (
        <div className="pt-3">
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-colors",
              dark ? "text-white/40 hover:text-white/80" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <X className="h-3 w-3" />
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
