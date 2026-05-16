"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { DEGREES, JOB_FIELDS, KVIS_YEARS } from "@/lib/constants/options";
import { COUNTRIES } from "@/lib/constants/countries";
import type { SearchParams } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  values: SearchParams;
  onChange: (params: SearchParams) => void;
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-sm font-medium py-2 hover:text-primary transition-colors"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="space-y-3 pb-3">{children}</div>}
    </div>
  );
}

export function SearchFilters({ values, onChange }: Props) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<SearchParams>({ defaultValues: values });
  const countryVal = watch("country");

  const onSubmit = (data: SearchParams) => {
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== undefined && v !== null)
    ) as SearchParams;
    onChange(clean);
  };

  const handleClear = () => {
    reset({});
    onChange({});
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          {/* Name */}
          <div className="space-y-1 pb-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Name</Label>
            <Input placeholder="Search by name…" {...register("name")} />
          </div>

          <Separator />

          {/* Class Year */}
          <Section title="Class Year">
            <Select onValueChange={(v) => setValue("kvis_year", v ? parseInt(v) : undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Any year" />
              </SelectTrigger>
              <SelectContent>
                {KVIS_YEARS.map((y) => (
                  <SelectItem key={y.value} value={String(y.value)}>{y.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          <Separator />

          {/* Location */}
          <Section title="Location">
            <Select onValueChange={(v) => setValue("country", v || undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Any country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          <Separator />

          {/* Education */}
          <Section title="Education">
            <div className="space-y-2">
              <Input placeholder="University name…" {...register("uni_name")} />
              <Select onValueChange={(v) => setValue("degree", v || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any degree" />
                </SelectTrigger>
                <SelectContent>
                  {DEGREES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Major…" {...register("major")} />
              <Input placeholder="Scholarship…" {...register("scholarship")} />
            </div>
          </Section>

          <Separator />

          {/* Career */}
          <Section title="Career">
            <div className="space-y-2">
              <Input placeholder="Job title…" {...register("job_title")} />
              <Input placeholder="Employer…" {...register("employer")} />
              <Select onValueChange={(v) => setValue("job_field", v || undefined)}>
                <SelectTrigger>
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

          <div className="flex gap-2 pt-4">
            <Button type="submit" variant="outline" className="flex-1">Search</Button>
            <Button type="button" variant="outline" size="icon" onClick={handleClear} title="Clear filters">
              <X className="h-4 w-4" />
            </Button>
          </div>
    </form>
  );
}
