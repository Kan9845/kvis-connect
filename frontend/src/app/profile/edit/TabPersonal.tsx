"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Check, Dot } from "lucide-react";
import { userApi } from "@/lib/api";
import {
  SectionHead,
  FieldRow,
  TagPills,
  inputCls,
  selectTriggerCls,
} from "./components";
import {
  ZODIAC_SIGNS,
  CHRONOTYPES,
  LANGUAGE_OPTIONS,
  LANGUAGE_PROFICIENCY,
  HOBBIES,
} from "./constants";

interface TabPersonalProps {
  isSetup: boolean;
  me: {
    zodiac?: string | null;
    chronotype?: string | null;
  };
  refetch: () => Promise<void>;
  languages: { lang: string; proficiency?: string }[];
  setLanguages: React.Dispatch<React.SetStateAction<{ lang: string; proficiency?: string }[]>>;
  hobbies: Record<string, string[]>;
  setHobbies: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  kvisFavMenu: string;
  setKvisFavMenu: React.Dispatch<React.SetStateAction<string>>;
  kvisFavEvent: string;
  setKvisFavEvent: React.Dispatch<React.SetStateAction<string>>;
  kvisFavArea: string;
  setKvisFavArea: React.Dispatch<React.SetStateAction<string>>;
  savePersonal: () => Promise<void>;
}

export function TabPersonal({
  isSetup,
  me,
  refetch,
  languages,
  setLanguages,
  hobbies,
  setHobbies,
  kvisFavMenu,
  setKvisFavMenu,
  kvisFavEvent,
  setKvisFavEvent,
  kvisFavArea,
  setKvisFavArea,
  savePersonal,
}: TabPersonalProps) {
  return (
    <section>
      <SectionHead
        numeral="I."
        kicker={
          <>
            Personal <Dot className="h-3 w-3 shrink-0" aria-hidden /> KVIS
            only
          </>
        }
        title="Personality & vibe"
      />
      <FieldRow label="Zodiac">
        <Select
          defaultValue={me.zodiac ?? undefined}
          onValueChange={(v) =>
            userApi.updateMe({ zodiac: v }).then(refetch)
          }
        >
          <SelectTrigger className={selectTriggerCls}>
            <SelectValue placeholder="Select sign" />
          </SelectTrigger>
          <SelectContent>
            {ZODIAC_SIGNS.map((z) => (
              <SelectItem key={z} value={z}>
                {z}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="Chronotype">
        <Select
          defaultValue={me.chronotype ?? undefined}
          onValueChange={(v) =>
            userApi.updateMe({ chronotype: v }).then(refetch)
          }
        >
          <SelectTrigger className={selectTriggerCls}>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {CHRONOTYPES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="Languages">
        <div className="space-y-2">
          {languages.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select
                value={l.lang}
                onValueChange={(v) =>
                  setLanguages((prev) =>
                    prev.map((x, j) => (j === i ? { ...x, lang: v } : x)),
                  )
                }
              >
                <SelectTrigger className={`${selectTriggerCls} w-28`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={l.proficiency ?? ""}
                onValueChange={(v) =>
                  setLanguages((prev) =>
                    prev.map((x, j) =>
                      j === i ? { ...x, proficiency: v } : x,
                    ),
                  )
                }
              >
                <SelectTrigger className={`${selectTriggerCls} w-24`}>
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_PROFICIENCY.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() =>
                  setLanguages((prev) => prev.filter((_, j) => j !== i))
                }
                className="text-[var(--kvis-text3)] hover:text-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setLanguages((prev) => [...prev, { lang: "Thai" }])
            }
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--kvis-text3)] hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" /> Add language
          </button>
        </div>
      </FieldRow>

      <SectionHead
        numeral="II."
        kicker={
          <>
            Personal <Dot className="h-3 w-3 shrink-0" aria-hidden /> KVIS
            only
          </>
        }
        title="KVIS nostalgia"
      />
      <FieldRow label="Fav menu">
        <Input
          placeholder="e.g. ข้าวไข่เจียว"
          value={kvisFavMenu}
          onChange={(e) => setKvisFavMenu(e.target.value)}
          className={inputCls}
        />
      </FieldRow>
      <FieldRow label="Fav event">
        <Input
          placeholder="e.g. Science Fair"
          value={kvisFavEvent}
          onChange={(e) => setKvisFavEvent(e.target.value)}
          className={inputCls}
        />
      </FieldRow>
      <FieldRow label="Fav area">
        <Input
          placeholder="e.g. The pond"
          value={kvisFavArea}
          onChange={(e) => setKvisFavArea(e.target.value)}
          className={inputCls}
        />
      </FieldRow>

      <SectionHead
        numeral="III."
        kicker={
          <>
            Personal <Dot className="h-3 w-3 shrink-0" aria-hidden /> KVIS
            only
          </>
        }
        title="Hobbies & interests"
      />
      {(Object.entries(HOBBIES) as [string, string[]][]).map(
        ([cat, opts]) => (
          <div key={cat} className="pt-6 pb-3">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-foreground mb-3">
              {cat.replace(/_/g, " ")}
            </p>
            <TagPills
              options={opts}
              selected={hobbies[cat] ?? []}
              onChange={(v) =>
                setHobbies((prev) => ({ ...prev, [cat]: v }))
              }
            />
          </div>
        ),
      )}

      {!isSetup && (
        <div className="pt-8">
          <Button
            type="button"
            onClick={savePersonal}
            className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2"
          >
            <Check className="h-3.5 w-3.5" /> Save personal
          </Button>
        </div>
      )}
    </section>
  );
}
