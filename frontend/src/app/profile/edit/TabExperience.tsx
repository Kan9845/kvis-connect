"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Check } from "lucide-react";
import { CountrySelect } from "@/components/ui/location-selects";
import { Separator } from "@/components/ui/separator";
import type { Competition, ExperienceCamp, ClubLeadership } from "@/lib/types";
import {
  SectionHead,
  FieldRow,
  PrivacyToggle,
  inputCls,
  selectTriggerCls,
  textareaCls,
} from "./components";

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPETITION_TYPES = [
  "Olympiad",
  "Scientific Tournament",
  "Research Competition / Science Fair",
  "Hackathon / Tech Competition",
  "Case Competition / Business Pitching",
  "Athletics / Sports Tournament",
  "Other",
];

const SCOPES = ["International", "National", "Regional", "Institutional"];

const RESULTS = [
  "Gold Medal",
  "Silver Medal",
  "Bronze Medal",
  "First Place",
  "Runner-Up",
  "Finalist",
  "Honorable Mention",
  "Participant",
  "Other",
];

const CAMP_TYPES = [
  "Academic Camp",
  "Research Conference / Symposium",
  "International Exchange Program / Study Visit",
  "Workshop / Fellowship Program",
  "Other",
];

const CAMP_FIELDS = [
  "Mathematics & Data Science",
  "Computer Science & Software Engineering",
  "Physical Sciences & Engineering",
  "Chemical Sciences & Engineering",
  "Life Sciences & Bioengineering",
  "Earth, Space, & Environmental Sciences",
  "Non-STEM / Humanities / Social Sciences",
];

const CAMP_ROLES = [
  "Presenter (Oral Presentation)",
  "Presenter (Poster Presentation)",
  "Selected Attendee / Participant",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MAX_ENTRIES = 10;

// ─── Types ────────────────────────────────────────────────────────────────────

interface TabExperienceProps {
  isSetup: boolean;
  isDirty: boolean;
  competitions: Competition[];
  setCompetitions: React.Dispatch<React.SetStateAction<Competition[]>>;
  camps: ExperienceCamp[];
  setCamps: React.Dispatch<React.SetStateAction<ExperienceCamp[]>>;
  clubs: ClubLeadership[];
  setClubs: React.Dispatch<React.SetStateAction<ClubLeadership[]>>;
  saveExperience: () => Promise<void>;
}

// ─── Sub-section helpers ──────────────────────────────────────────────────────

function EntryHeader({
  index,
  label,
  isCurrent,
  isPublic,
  onPrivacyChange,
  onRemove,
}: {
  index: number;
  label: string;
  isCurrent?: boolean;
  isPublic: boolean;
  onPrivacyChange: (v: boolean) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-y-2 mb-4">
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-mono tabular-nums font-semibold text-[var(--kvis-text3)]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)]">
          {label}
        </span>
        {isCurrent && (
          <span
            className="px-1.5 py-0.5 text-xs font-bold uppercase tracking-[0.22em] leading-none text-white"
            style={{ background: "var(--kvis-green-light)" }}
          >
            Current
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <PrivacyToggle value={isPublic} onChange={onPrivacyChange} />
        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-bold uppercase tracking-[0.22em] inline-flex items-center gap-1.5 hover:text-foreground transition-colors text-[var(--kvis-text3)]"
        >
          <Trash2 className="h-3 w-3" /> Remove
        </button>
      </div>
    </div>
  );
}

function AddButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="h-auto rounded-none border-foreground bg-transparent px-4 py-2.5 text-xs font-bold uppercase tracking-[0.28em] text-foreground hover:bg-foreground hover:text-background gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Plus className="h-3.5 w-3.5" /> {label}
    </Button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TabExperience({
  isSetup,
  isDirty,
  competitions,
  setCompetitions,
  camps,
  setCamps,
  clubs,
  setClubs,
  saveExperience,
}: TabExperienceProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveExperience();
    } finally {
      setSaving(false);
    }
  };

  // ── Competitions helpers
  const updateComp = <K extends keyof Competition>(i: number, field: K, value: Competition[K]) =>
    setCompetitions((prev) => prev.map((x, j) => (j === i ? { ...x, [field]: value } : x)));

  // ── Camps helpers
  const updateCamp = <K extends keyof ExperienceCamp>(i: number, field: K, value: ExperienceCamp[K]) =>
    setCamps((prev) => prev.map((x, j) => (j === i ? { ...x, [field]: value } : x)));

  // ── Clubs helpers
  const updateClub = <K extends keyof ClubLeadership>(i: number, field: K, value: ClubLeadership[K]) =>
    setClubs((prev) => prev.map((x, j) => (j === i ? { ...x, [field]: value } : x)));

  return (
    <section>
      {/* ── I. Competitions ──────────────────────────────────────────────── */}
      <SectionHead
        numeral="I."
        kicker="Competitions"
        title="Competitions, Tournaments & Research Fairs"
      />

      {competitions.length === 0 && (
        <div className="py-10 border-b border-[var(--kvis-border)] text-sm text-muted-foreground italic">
          No competitions added yet.
        </div>
      )}

      {competitions.map((c, i) => (
        <div key={i} className="py-7 border-b border-[var(--kvis-border)]">
          <EntryHeader
            index={i}
            label="Competition"
            isPublic={c.is_public}
            onPrivacyChange={(v) => updateComp(i, "is_public", v)}
            onRemove={() => setCompetitions((prev) => prev.filter((_, j) => j !== i))}
          />

          <FieldRow label="Event name" required>
            <Input
              placeholder="e.g. Thailand Chemistry Olympiad (TChO)"
              value={c.event_name}
              onChange={(e) => updateComp(i, "event_name", e.target.value)}
              className={inputCls}
            />
          </FieldRow>

          <FieldRow label="Type" required>
            <Select value={c.competition_type} onValueChange={(v) => updateComp(i, "competition_type", v)}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {COMPETITION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {c.competition_type === "Other" && (
              <Input
                placeholder="Please specify"
                value={c.competition_type_other ?? ""}
                onChange={(e) => updateComp(i, "competition_type_other", e.target.value)}
                className={`${inputCls} mt-2`}
              />
            )}
          </FieldRow>

          <FieldRow label="Scope" required>
            <Select value={c.scope} onValueChange={(v) => updateComp(i, "scope", v)}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                {SCOPES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow label="Result">
            <Select value={c.result ?? ""} onValueChange={(v) => updateComp(i, "result", v)}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="Select result" />
              </SelectTrigger>
              <SelectContent>
                {RESULTS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {c.result === "Other" && (
              <Input
                placeholder="Please specify"
                value={c.result_other ?? ""}
                onChange={(e) => updateComp(i, "result_other", e.target.value)}
                className={`${inputCls} mt-2`}
              />
            )}
          </FieldRow>

          <FieldRow label="Year">
            <Input
              placeholder="e.g. 2023"
              value={c.year ?? ""}
              onChange={(e) => updateComp(i, "year", e.target.value)}
              className={`${inputCls} w-28`}
            />
          </FieldRow>
        </div>
      ))}

      <div className="pt-8 flex items-center gap-4 flex-wrap border-b border-[var(--kvis-border)] pb-8">
        <AddButton
          label="Add competition"
          disabled={competitions.length >= MAX_ENTRIES}
          onClick={() =>
            setCompetitions((prev) => [
              ...prev,
              { event_name: "", competition_type: "", scope: "", is_public: true },
            ])
          }
        />
        {competitions.length >= MAX_ENTRIES && (
          <span className="text-xs text-[var(--kvis-text3)]">Maximum {MAX_ENTRIES} entries</span>
        )}
      </div>

      {/* ── II. Camps & Conferences ─────────────────────────────────────── */}
      <SectionHead
        numeral="II."
        kicker="Camps & Conferences"
        title="Camps, Conferences & Exchange Programs"
      />

      {camps.length === 0 && (
        <div className="py-10 border-b border-[var(--kvis-border)] text-sm text-muted-foreground italic">
          No programs added yet.
        </div>
      )}

      {camps.map((c, i) => (
        <div key={i} className="py-7 border-b border-[var(--kvis-border)]">
          <EntryHeader
            index={i}
            label="Program"
            isPublic={c.is_public}
            onPrivacyChange={(v) => updateCamp(i, "is_public", v)}
            onRemove={() => setCamps((prev) => prev.filter((_, j) => j !== i))}
          />

          <FieldRow label="Program name" required>
            <Input
              placeholder="e.g. POSN Biology Camp, CERN High School Visit"
              value={c.program_name}
              onChange={(e) => updateCamp(i, "program_name", e.target.value)}
              className={inputCls}
            />
          </FieldRow>

          <FieldRow label="Type" required>
            <Select value={c.program_type} onValueChange={(v) => updateCamp(i, "program_type", v)}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {CAMP_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {c.program_type === "Other" && (
              <Input
                placeholder="Please specify"
                value={c.program_type_other ?? ""}
                onChange={(e) => updateCamp(i, "program_type_other", e.target.value)}
                className={`${inputCls} mt-2`}
              />
            )}
          </FieldRow>

          <FieldRow label="Field" required>
            <Select value={c.field} onValueChange={(v) => updateCamp(i, "field", v)}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {CAMP_FIELDS.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow label="Role">
            <Select value={c.role ?? ""} onValueChange={(v) => updateCamp(i, "role", v)}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {CAMP_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow label="Country">
            <CountrySelect
              variant="underline"
              value={c.country ?? ""}
              onChange={(v) => updateCamp(i, "country", v)}
            />
          </FieldRow>

          <FieldRow label="Year">
            <Input
              placeholder="e.g. 2023"
              value={c.year ?? ""}
              onChange={(e) => updateCamp(i, "year", e.target.value)}
              className={`${inputCls} w-28`}
            />
          </FieldRow>
        </div>
      ))}

      <div className="pt-8 flex items-center gap-4 flex-wrap border-b border-[var(--kvis-border)] pb-8">
        <AddButton
          label="Add program"
          disabled={camps.length >= MAX_ENTRIES}
          onClick={() =>
            setCamps((prev) => [
              ...prev,
              { program_name: "", program_type: "", field: "", is_public: true },
            ])
          }
        />
        {camps.length >= MAX_ENTRIES && (
          <span className="text-xs text-[var(--kvis-text3)]">Maximum {MAX_ENTRIES} entries</span>
        )}
      </div>

      {/* ── III. Clubs & Leadership ─────────────────────────────────────── */}
      <SectionHead
        numeral="III."
        kicker="Clubs & Leadership"
        title="Clubs, Leadership & Volunteer Initiatives"
      />

      {clubs.length === 0 && (
        <div className="py-10 border-b border-[var(--kvis-border)] text-sm text-muted-foreground italic">
          No clubs or initiatives added yet.
        </div>
      )}

      {clubs.map((c, i) => (
        <div key={i} className="py-7 border-b border-[var(--kvis-border)]">
          <EntryHeader
            index={i}
            label="Club / Initiative"
            isCurrent={c.is_current}
            isPublic={c.is_public}
            onPrivacyChange={(v) => updateClub(i, "is_public", v)}
            onRemove={() => setClubs((prev) => prev.filter((_, j) => j !== i))}
          />

          <FieldRow label="Organization" required>
            <Input
              placeholder="e.g. KVIS Student Committee, Thai Student Association"
              value={c.org_name}
              onChange={(e) => updateClub(i, "org_name", e.target.value)}
              className={inputCls}
            />
          </FieldRow>

          <FieldRow label="Role / Position" required>
            <Input
              placeholder="e.g. President, Founder, Core Volunteer"
              value={c.role_title}
              onChange={(e) => updateClub(i, "role_title", e.target.value)}
              className={inputCls}
            />
          </FieldRow>

          <FieldRow label="Start date">
            <div className="flex items-center gap-2">
              <Select
                value={c.start_month ?? ""}
                onValueChange={(v) => updateClub(i, "start_month", v)}
              >
                <SelectTrigger className={`${selectTriggerCls} w-28`}>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Year"
                value={c.start_year ?? ""}
                onChange={(e) => updateClub(i, "start_year", e.target.value)}
                className={`${inputCls} w-20`}
              />
            </div>
          </FieldRow>

          <FieldRow label="End date">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Select
                  value={c.end_month ?? ""}
                  onValueChange={(v) => updateClub(i, "end_month", v)}
                  disabled={c.is_current}
                >
                  <SelectTrigger className={`${selectTriggerCls} w-28 disabled:opacity-40`}>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Year"
                  value={c.is_current ? "" : (c.end_year ?? "")}
                  disabled={c.is_current}
                  onChange={(e) => updateClub(i, "end_year", e.target.value)}
                  className={`${inputCls} w-20 disabled:opacity-40`}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={c.is_current}
                  onChange={(e) => updateClub(i, "is_current", e.target.checked)}
                  className="h-4 w-4 accent-foreground"
                />
                <span>Current</span>
              </label>
            </div>
          </FieldRow>

          <FieldRow label="Description">
            <textarea
              placeholder="Brief description of your role or contribution (optional)"
              value={c.description ?? ""}
              onChange={(e) => updateClub(i, "description", e.target.value)}
              rows={3}
              className={textareaCls}
            />
          </FieldRow>
        </div>
      ))}

      <div className="pt-8 flex items-center gap-4 flex-wrap">
        <AddButton
          label="Add club / initiative"
          disabled={clubs.length >= MAX_ENTRIES}
          onClick={() =>
            setClubs((prev) => [
              ...prev,
              { org_name: "", role_title: "", is_current: false, is_public: true },
            ])
          }
        />
        {clubs.length >= MAX_ENTRIES && (
          <span className="text-xs text-[var(--kvis-text3)]">Maximum {MAX_ENTRIES} entries</span>
        )}
      </div>

      {/* ── Save ────────────────────────────────────────────────────────── */}
      {!isSetup && (
        <div className="pt-10 pb-4">
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">Saving…</span>
            ) : (
              <><Check className="h-3.5 w-3.5" /> Save experience</>
            )}
          </Button>
        </div>
      )}
    </section>
  );
}
