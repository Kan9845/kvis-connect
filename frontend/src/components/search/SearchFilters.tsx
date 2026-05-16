"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DEGREES, JOB_FIELDS, KVIS_YEARS } from "@/lib/constants/options";
import { COUNTRIES } from "@/lib/constants/countries";
import type { SearchParams } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  values: SearchParams;
  onChange: (params: SearchParams) => void;
  dark?: boolean;
}

function Section({ title, children, defaultOpen = false, dark = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean; dark?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center justify-between w-full text-sm font-medium py-2 transition-colors",
          dark ? "text-white hover:text-white/80" : "hover:text-primary"
        )}
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="space-y-3 pb-3">{children}</div>}
    </div>
  );
}

export function SearchFilters({ values, onChange, dark = false }: Props) {
  const { register, reset, setValue, watch } = useForm<SearchParams>({ defaultValues: values });
  const formValues = watch();
  const serialized = JSON.stringify(formValues);

  useEffect(() => {
    const t = setTimeout(() => {
      const clean = Object.fromEntries(
        Object.entries(formValues).filter(([, v]) => v !== "" && v !== undefined && v !== null)
      ) as SearchParams;
      onChange(clean);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  const handleClear = () => {
    reset({});
    onChange({});
  };

  const hasAny = Object.values(formValues).some((v) => v !== "" && v !== undefined && v !== null);

  const inputCls = dark
    ? "bg-transparent border-white/60 text-white placeholder:text-white/60 focus-visible:ring-white/40"
    : "";
  const triggerCls = dark
    ? "bg-transparent border-white/60 text-white data-[placeholder]:text-white/60 [&_svg]:text-white/70"
    : "";
  const clearBtnCls = dark
    ? "text-white/70 hover:text-white"
    : "text-muted-foreground hover:text-foreground";
  const sepCls = dark ? "bg-white/20" : "";

  return (
    <div className="space-y-1">
          {/* Name */}
          <div className="space-y-1 pb-3">
            <Label className={cn("text-xs uppercase tracking-wide", dark ? "text-white/70" : "text-muted-foreground")}>Name</Label>
            <Input placeholder="Search by name…" {...register("name")} className={inputCls} />
          </div>

          <Separator className={sepCls} />

          {/* Class Year */}
          <Section title="Class Year" dark={dark}>
            <Select onValueChange={(v) => setValue("kvis_year", v ? parseInt(v) : undefined)}>
              <SelectTrigger className={triggerCls}>
                <SelectValue placeholder="Any year" />
              </SelectTrigger>
              <SelectContent>
                {KVIS_YEARS.map((y) => (
                  <SelectItem key={y.value} value={String(y.value)}>{y.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          <Separator className={sepCls} />

          {/* Location */}
          <Section title="Location" dark={dark}>
            <Select onValueChange={(v) => setValue("country", v || undefined)}>
              <SelectTrigger className={triggerCls}>
                <SelectValue placeholder="Any country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          <Separator className={sepCls} />

          {/* Education */}
          <Section title="Education" dark={dark}>
            <div className="space-y-2">
              <Input placeholder="University name…" {...register("uni_name")} className={inputCls} />
              <Select onValueChange={(v) => setValue("degree", v || undefined)}>
                <SelectTrigger className={triggerCls}>
                  <SelectValue placeholder="Any degree" />
                </SelectTrigger>
                <SelectContent>
                  {DEGREES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Major…" {...register("major")} className={inputCls} />
              <Input placeholder="Scholarship…" {...register("scholarship")} className={inputCls} />
            </div>
          </Section>

          <Separator className={sepCls} />

          {/* Career */}
          <Section title="Career" dark={dark}>
            <div className="space-y-2">
              <Input placeholder="Job title…" {...register("job_title")} className={inputCls} />
              <Input placeholder="Employer…" {...register("employer")} className={inputCls} />
              <Select onValueChange={(v) => setValue("job_field", v || undefined)}>
                <SelectTrigger className={triggerCls}>
                  <SelectValue placeholder="Any field" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_FIELDS.map((j) => (
                    <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Section>

          {hasAny && (
            <div className="flex pt-3">
              <button
                type="button"
                onClick={handleClear}
                className={cn("text-xs underline-offset-2 hover:underline transition-colors", clearBtnCls)}
              >
                Reset filters
              </button>
            </div>
          )}
    </div>
  );
}
