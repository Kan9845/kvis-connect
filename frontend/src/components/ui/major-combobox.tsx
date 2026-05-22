"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const MAJORS = [
  // Computer & Technology
  "Computer Science", "Computer Engineering", "Software Engineering",
  "Information Technology", "Information Systems", "Cybersecurity",
  "Data Science", "Artificial Intelligence", "Machine Learning",
  "Human-Computer Interaction", "Network Engineering",
  // Engineering
  "Electrical Engineering", "Electronic Engineering", "Mechanical Engineering",
  "Chemical Engineering", "Civil Engineering", "Aerospace Engineering",
  "Biomedical Engineering", "Environmental Engineering", "Industrial Engineering",
  "Materials Engineering", "Nuclear Engineering", "Petroleum Engineering",
  "Robotics Engineering", "Systems Engineering",
  // Natural Sciences
  "Physics", "Applied Physics", "Chemistry", "Biochemistry",
  "Biology", "Molecular Biology", "Microbiology", "Genetics",
  "Mathematics", "Applied Mathematics", "Statistics", "Astronomy",
  "Earth Sciences", "Environmental Science", "Neuroscience",
  // Medicine & Health
  "Medicine", "Pharmacy", "Nursing", "Dentistry", "Public Health",
  "Biomedical Science", "Physiotherapy", "Veterinary Medicine",
  "Nutrition & Dietetics", "Occupational Therapy",
  // Business & Economics
  "Business Administration", "Economics", "Finance", "Accounting",
  "Marketing", "Management", "International Business",
  "Supply Chain Management", "Entrepreneurship", "Human Resources",
  "Operations Management",
  // Social Sciences
  "Psychology", "Sociology", "Political Science", "International Relations",
  "Anthropology", "Geography", "Criminology", "Social Work",
  "Development Studies", "Gender Studies",
  // Arts & Humanities
  "Philosophy", "History", "Literature", "Linguistics",
  "English", "Communications", "Journalism", "Media Studies",
  "Fine Arts", "Graphic Design", "Architecture", "Interior Design",
  "Film & Media", "Music", "Theatre", "Art History",
  // Law
  "Law", "International Law", "Criminal Justice",
  // Education
  "Education", "Early Childhood Education", "Educational Psychology",
  // Other
  "Agriculture", "Food Science", "Forestry", "Marine Science",
  "Urban Planning", "Real Estate",
].sort();

interface Props {
  value: string;
  onChange: (v: string) => void;
  borderColor?: string;
}

export function MajorCombobox({ value, onChange, borderColor }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualText, setManualText] = useState("");

  const filtered = query.trim()
    ? MAJORS.filter((m) => m.toLowerCase().includes(query.toLowerCase())).slice(0, 40)
    : MAJORS.slice(0, 40);

  function enterManual() {
    setManualText(value && !MAJORS.includes(value) ? value : "");
    setManualMode(true);
    setOpen(false);
  }

  if (manualMode) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Enter your major"
          value={manualText}
          onChange={(e) => { setManualText(e.target.value); onChange(e.target.value); }}
          autoFocus
          className="w-full h-12 border px-4 text-[15px] bg-transparent outline-none focus:outline-none"
          style={{ borderColor }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "oklch(78% 0.01 294)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = borderColor ?? "")}
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className="w-full h-12 border px-4 flex items-center justify-between text-[15px] transition-colors"
          style={{ borderColor, background: "transparent" }}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={cn(value ? "text-foreground" : "text-foreground/25")}>
            {value || "Select major..."}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-40 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-none" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search major..." value={query} onValueChange={setQuery} />
          <CommandList className="max-h-60">
            {filtered.length === 0 ? (
              <CommandEmpty>
                No match -{" "}
                <button type="button" className="underline" onClick={enterManual}>
                  enter manually
                </button>
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((m) => (
                  <CommandItem key={m} value={m} onSelect={() => { onChange(m); setOpen(false); setQuery(""); }}>
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", value === m ? "opacity-100" : "opacity-0")} />
                    {m}
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
