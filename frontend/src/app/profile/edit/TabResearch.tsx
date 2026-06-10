"use client";
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
import {
  SectionHead,
  FieldRow,
  TagPills,
  inputCls,
  textareaCls,
  selectTriggerCls,
} from "./components";
import {
  RESEARCH_CATEGORIES,
  PORTFOLIO_TYPES,
  PROJECT_STATUSES,
} from "./constants";

interface TabResearchProps {
  isSetup: boolean;
  isStudent: boolean;
  isDirty: boolean;
  researchInterests: string[];
  setResearchInterests: React.Dispatch<React.SetStateAction<string[]>>;
  projects: {
    title: string;
    advisor?: string;
    advisor2?: string;
    description?: string;
    status: string;
    link?: string;
  }[];
  setProjects: React.Dispatch<React.SetStateAction<{
    title: string;
    advisor?: string;
    advisor2?: string;
    description?: string;
    status: string;
    link?: string;
  }[]>>;
  publications: { citation: string; doi?: string }[];
  setPublications: React.Dispatch<React.SetStateAction<{ citation: string; doi?: string }[]>>;
  portfolioLinks: { type: string; url: string }[];
  setPortfolioLinks: React.Dispatch<React.SetStateAction<{ type: string; url: string }[]>>;
  saveResearch: () => Promise<void>;
}

export function TabResearch({
  isSetup,
  isStudent,
  isDirty,
  researchInterests,
  setResearchInterests,
  projects,
  setProjects,
  publications,
  setPublications,
  portfolioLinks,
  setPortfolioLinks,
  saveResearch,
}: TabResearchProps) {
  return (
    <section>
      {isStudent && (
        <div className="mt-8 mb-2 py-3 border-b border-[var(--kvis-border)]">
          <p
            className="text-xs font-bold uppercase tracking-[0.22em] mb-1"
            style={{ color: "var(--kvis-purple)" }}
          >
            For students
          </p>
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--kvis-text2)" }}
          >
            Share your research interests and ongoing projects - this is
            what other Kvisians will see when they look you up.
          </p>
        </div>
      )}
      <SectionHead
        numeral="I."
        kicker="Research"
        title="Areas of interest"
      />
      <div className="pb-2">
        {RESEARCH_CATEGORIES.map((cat) => (
          <div key={cat.group} className="pt-6 pb-3">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-foreground mb-3">
              {cat.group}
            </p>
            <TagPills
              options={cat.options}
              selected={researchInterests}
              onChange={setResearchInterests}
            />
          </div>
        ))}
      </div>

      <SectionHead numeral="II." kicker="Research" title="Projects" />
      {projects.map((p, i) => (
        <div
          key={i}
          className="py-5 border-b border-[var(--kvis-border)]"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono tabular-nums text-[var(--kvis-text3)]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() =>
                setProjects((prev) => prev.filter((_, j) => j !== i))
              }
              className="text-xs font-bold uppercase tracking-[0.22em] inline-flex items-center gap-1.5 text-[var(--kvis-text3)] hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
          <FieldRow label="Title" required>
            <Input
              placeholder="e.g. Machine Learning Model for Climate Prediction"
              value={p.title}
              onChange={(e) =>
                setProjects((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, title: e.target.value } : x,
                  ),
                )
              }
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="Advisor / PI">
            <Input
              placeholder="Name"
              value={p.advisor ?? ""}
              onChange={(e) =>
                setProjects((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, advisor: e.target.value } : x,
                  ),
                )
              }
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="Advisor 2">
            <Input
              placeholder="Name (optional)"
              value={p.advisor2 ?? ""}
              onChange={(e) =>
                setProjects((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, advisor2: e.target.value } : x,
                  ),
                )
              }
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="Description">
            <Textarea
              placeholder="Brief overview of the project, objectives, and your role..."
              rows={3}
              value={p.description ?? ""}
              onChange={(e) =>
                setProjects((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, description: e.target.value } : x,
                  ),
                )
              }
              className={`${textareaCls} min-h-[80px]`}
            />
          </FieldRow>
          <FieldRow label="Status">
            <Select
              value={p.status}
              onValueChange={(v) =>
                setProjects((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, status: v } : x)),
                )
              }
            >
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Link">
            <Input
              placeholder="https://github.com/..."
              value={p.link ?? ""}
              onChange={(e) =>
                setProjects((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, link: e.target.value } : x,
                  ),
                )
              }
              className={inputCls}
            />
          </FieldRow>
        </div>
      ))}
      {projects.length < 5 && (
        <button
          type="button"
          onClick={() =>
            setProjects((prev) => [
              ...prev,
              { title: "", status: "Ongoing" },
            ])
          }
          className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--kvis-text3)] hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" /> Add project
        </button>
      )}

      <SectionHead numeral="III." kicker="Research" title="Publications" />
      {publications.map((p, i) => (
        <div
          key={i}
          className="py-5 border-b border-[var(--kvis-border)]"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono tabular-nums text-[var(--kvis-text3)]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() =>
                setPublications((prev) => prev.filter((_, j) => j !== i))
              }
              className="text-xs font-bold uppercase tracking-[0.22em] inline-flex items-center gap-1.5 text-[var(--kvis-text3)] hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
          <FieldRow label="Citation" hint="Paste APA style.">
            <Textarea
              placeholder="e.g. Smith, J., Johnson, A., & Lee, M. (2024). Title of research paper. Journal Name, 15(3), 123-145."
              rows={3}
              value={p.citation}
              onChange={(e) =>
                setPublications((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, citation: e.target.value } : x,
                  ),
                )
              }
              className={`${textareaCls} min-h-[80px]`}
            />
          </FieldRow>
          <FieldRow label="DOI / Link">
            <Input
              placeholder="https://doi.org/..."
              value={p.doi ?? ""}
              onChange={(e) =>
                setPublications((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, doi: e.target.value } : x,
                  ),
                )
              }
              className={inputCls}
            />
          </FieldRow>
        </div>
      ))}
      {publications.length < 5 && (
        <button
          type="button"
          onClick={() =>
            setPublications((prev) => [...prev, { citation: "" }])
          }
          className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--kvis-text3)] hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" /> Add publication
        </button>
      )}

      <SectionHead
        numeral="IV."
        kicker="Research"
        title="Portfolio links"
      />
      {portfolioLinks.map((l, i) => (
        <div
          key={i}
          className="py-3"
        >
          <div className="flex items-center gap-3">
            <Select
              value={l.type}
              onValueChange={(v) =>
                setPortfolioLinks((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, type: v } : x)),
                )
              }
            >
              <SelectTrigger className={`${selectTriggerCls} w-36`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PORTFOLIO_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="https://..."
              value={l.url}
              onChange={(e) =>
                setPortfolioLinks((prev) =>
                  prev.map((x, j) =>
                    j === i ? { ...x, url: e.target.value } : x,
                  ),
                )
              }
              className={`${inputCls} flex-1`}
            />
            <button
              type="button"
              onClick={() =>
                setPortfolioLinks((prev) =>
                  prev.filter((_, j) => j !== i),
                )
              }
              className="text-[var(--kvis-text3)] hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
      {portfolioLinks.length < 3 && (
        <button
          type="button"
          onClick={() =>
            setPortfolioLinks((prev) => [
              ...prev,
              { type: "GitHub", url: "" },
            ])
          }
          className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--kvis-text3)] hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" /> Add link
        </button>
      )}

      {!isSetup && (
        <div className="pt-8">
          <Button
            type="button"
            onClick={saveResearch}
            disabled={!isDirty}
            className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="h-3.5 w-3.5" /> Save research
          </Button>
        </div>
      )}
    </section>
  );
}
