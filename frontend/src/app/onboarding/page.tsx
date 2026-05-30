"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { userApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, GraduationCap, Users, BookOpen } from "lucide-react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const P = {
  purple:     "var(--kvis-purple)",
  purpleSoft: "var(--kvis-purple-soft)",
  green:      "var(--kvis-green-light)",
  text3:      "var(--kvis-text3)",
  rule:       "var(--kvis-rule)",
};

const inputCls = "w-full bg-transparent border-0 border-b border-foreground/20 rounded-none px-0 py-2 text-sm md:text-base text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:border-foreground transition-colors";

type Role = "alumni" | "student" | "faculty";
type Step = "role" | "details";

const KVIS_COHORTS = Array.from({ length: 25 }, (_, i) => i + 1).reverse(); // K25 → K1
const GRADES = [
  { value: 12, label: "M.6", sub: "Final year" },
  { value: 11, label: "M.5", sub: "Second year" },
  { value: 10, label: "M.4", sub: "First year" },
];
const ELEMENTALS = [
  { value: "earth", label: "Earth 🌍" },
  { value: "water", label: "Water 💧" },
  { value: "air",   label: "Air 💨" },
  { value: "fire",  label: "Fire 🔥" },
];

// ── Role card ─────────────────────────────────────────────────────────────────
function RoleCard({ role, label, sub, icon, selected, onClick }: {
  role: Role; label: string; sub: string;
  icon: React.ReactNode; selected: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className="relative w-full text-left border transition-all duration-200 p-6 group"
      style={{
        borderColor: selected ? P.purple : P.rule,
        background: selected ? P.purpleSoft : "transparent",
      }}>
      <div className="flex items-start gap-4">
        <div className="mt-0.5 shrink-0 w-9 h-9 flex items-center justify-center rounded-full border"
          style={{
            borderColor: selected ? P.purple : P.rule,
            color: selected ? P.purple : P.text3,
            background: selected ? "var(--kvis-purple-soft)" : "transparent",
          }}>
          {selected ? <Check className="h-4 w-4" /> : icon}
        </div>
        <div>
          <p className="text-base font-black tracking-tight text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{sub}</p>
        </div>
      </div>
    </button>
  );
}

// ── Pill toggle ───────────────────────────────────────────────────────────────
function PillToggle<T extends string | number>({ options, value, onChange, cols = 3 }: {
  options: { value: T; label: string; sub?: string }[];
  value: T | null;
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button key={String(o.value)} type="button" onClick={() => onChange(o.value)}
            className="px-3 py-2.5 text-xs font-bold uppercase tracking-[0.16em] border transition-all text-center"
            style={{
              borderColor: active ? P.purple : P.rule,
              color: active ? P.purple : P.text3,
              background: active ? P.purpleSoft : "transparent",
            }}>
            {o.label}
            {o.sub && <span className="block text-[10px] font-normal normal-case tracking-normal opacity-60 mt-0.5">{o.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const { user: me, loading, refetch } = useAuth();

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Alumni details
  const [kvisYear, setKvisYear] = useState<number | null>(null);

  // Student details
  const [grade, setGrade] = useState<number | null>(null);
  const [elemental, setElemental] = useState<string | null>(null);
  const [classNum, setClassNum] = useState<number | null>(null);

  // Faculty details
  const [teachStartYear, setTeachStartYear] = useState<string>("");
  const [isCurrentTeacher, setIsCurrentTeacher] = useState<boolean>(true);
  const [teachEndYear, setTeachEndYear] = useState<string>("");

  useEffect(() => {
    if (!loading && !me) router.push("/auth/login");
    if (!loading && me && me.profile_setup_done) router.push("/kvisian");
  }, [loading, me, router]);

  async function handleContinue() {
    setError(null);
    if (!role) { setError("Please select your role."); return; }
    setStep("details");
  }

  async function handleSubmit() {
    setError(null);

    if (role === "alumni") {
      if (!kvisYear) { setError("Please select your KVIS cohort."); return; }
    } else if (role === "student") {
      if (!grade) { setError("Please select your grade."); return; }
    } else if (role === "faculty") {
      if (!teachStartYear) { setError("Please enter your first year teaching at KVIS."); return; }
    }

    setSubmitting(true);
    try {
      if (role === "alumni") {
        await userApi.updateMe({ kvis_year: kvisYear! });
      } else if (role === "student") {
        await userApi.updateMe({
          current_grade: grade ?? undefined,
          current_elemental: elemental as any ?? undefined,
          current_class: classNum ?? undefined,
        });
      } else if (role === "faculty") {
        await userApi.updateMe({
          teach_start_year: parseInt(teachStartYear),
          teach_end_year: !isCurrentTeacher && teachEndYear ? parseInt(teachEndYear) : undefined,
          is_current_teacher: isCurrentTeacher,
        });
      }
      await refetch();
      router.push("/profile/edit?setup=1");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading || !me) return null;

  const issueDate = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 lg:px-12 py-12 lg:py-20">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-16 lg:gap-24 items-start">

          {/* Left — static hero */}
          <div className="lg:sticky lg:top-20">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="font-mono font-black text-3xl tabular-nums" style={{ color: P.green, letterSpacing: "-0.02em" }}>01</span>
              <span className="text-[11px] uppercase tracking-[0.32em] font-bold" style={{ color: P.text3 }}>
                {step === "role" ? "Who are you?" : "A bit more detail"}
              </span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.035em] leading-[0.9] text-foreground max-w-[14ch]">
              {step === "role" ? (
                <>Welcome to<br /><span style={{ color: P.purple }}>KVIS Connect.</span></>
              ) : (
                <>Almost<br /><span style={{ color: P.purple }}>there.</span></>
              )}
            </h1>

            <p className="mt-6 text-base text-muted-foreground max-w-[40ch] leading-relaxed">
              {step === "role"
                ? "Tell us who you are so we can show you the right things and the right people."
                : role === "alumni"
                  ? "Which KVIS cohort did you graduate with?"
                  : role === "student"
                    ? "Which grade are you currently in?"
                    : "When did you start teaching at KVIS?"
              }
            </p>

            <div className="mt-12 pt-6 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.3em]"
              style={{ borderColor: P.rule, color: P.text3 }}>
              <span>KVIS Connect</span>
              <span className="tabular-nums">{issueDate}</span>
            </div>
          </div>

          {/* Right — form */}
          <div>
            <AnimatePresence mode="wait">

              {/* Step 1 — Role selection */}
              {step === "role" && (
                <motion.div key="role"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3">

                  <RoleCard role="alumni" label="Alumni / Graduate"
                    sub="I have graduated from KVIS and am now studying or working."
                    icon={<GraduationCap className="h-4 w-4" />}
                    selected={role === "alumni"} onClick={() => setRole("alumni")} />

                  <RoleCard role="student" label="Current KVIS Student"
                    sub="I am currently enrolled at KVIS (M.4, M.5, or M.6)."
                    icon={<BookOpen className="h-4 w-4" />}
                    selected={role === "student"} onClick={() => setRole("student")} />

                  <RoleCard role="faculty" label="Faculty / Staff"
                    sub="I am or was a teacher or staff member at KVIS."
                    icon={<Users className="h-4 w-4" />}
                    selected={role === "faculty"} onClick={() => setRole("faculty")} />

                  {error && <p className="text-xs font-semibold text-red-500 pt-1">{error}</p>}

                  <div className="pt-4">
                    <button type="button" onClick={handleContinue} disabled={!role}
                      className="flex items-center gap-2 h-auto px-8 py-3.5 text-xs font-bold uppercase tracking-[0.28em] bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 transition-opacity">
                      Continue <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2 — Role-specific details */}
              {step === "details" && (
                <motion.div key="details"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-8">

                  {/* Alumni — cohort picker */}
                  {role === "alumni" && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.26em] mb-3" style={{ color: P.text3 }}>KVIS Cohort</p>
                      <div className="grid grid-cols-5 gap-2">
                        {KVIS_COHORTS.map(k => (
                          <button key={k} type="button" onClick={() => setKvisYear(k)}
                            className="py-2.5 text-sm font-black tabular-nums border transition-all"
                            style={{
                              borderColor: kvisYear === k ? P.purple : P.rule,
                              color: kvisYear === k ? P.purple : P.text3,
                              background: kvisYear === k ? P.purpleSoft : "transparent",
                            }}>
                            K{k}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Don't see yours? You can update this on your profile later.
                      </p>
                    </div>
                  )}

                  {/* Student — grade + element + class */}
                  {role === "student" && (
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.26em] mb-3" style={{ color: P.text3 }}>Current grade</p>
                        <PillToggle options={GRADES} value={grade} onChange={setGrade} cols={3} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.26em] mb-3" style={{ color: P.text3 }}>Elemental class <span className="normal-case font-normal opacity-50">(optional)</span></p>
                        <PillToggle options={ELEMENTALS} value={elemental} onChange={setElemental} cols={4} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.26em] mb-3" style={{ color: P.text3 }}>Class number <span className="normal-case font-normal opacity-50">(optional)</span></p>
                        <PillToggle
                          options={[1, 2, 3, 4].map(c => ({ value: c, label: String(c) }))}
                          value={classNum} onChange={setClassNum} cols={4}
                        />
                      </div>
                    </div>
                  )}

                  {/* Faculty — teaching period */}
                  {role === "faculty" && (
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.26em] mb-3" style={{ color: P.text3 }}>First year teaching at KVIS</p>
                        <input type="number" min={1990} max={new Date().getFullYear()}
                          value={teachStartYear} onChange={e => setTeachStartYear(e.target.value)}
                          placeholder={`e.g. ${new Date().getFullYear() - 5}`}
                          className={inputCls} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.26em] mb-3" style={{ color: P.text3 }}>Still teaching at KVIS?</p>
                        <PillToggle
                          options={[{ value: "yes", label: "Yes, currently" }, { value: "no", label: "No, I left" }]}
                          value={isCurrentTeacher ? "yes" : "no"}
                          onChange={v => setIsCurrentTeacher(v === "yes")}
                          cols={2}
                        />
                      </div>
                      {!isCurrentTeacher && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.26em] mb-3" style={{ color: P.text3 }}>Last year teaching</p>
                          <input type="number" min={1990} max={new Date().getFullYear()}
                            value={teachEndYear} onChange={e => setTeachEndYear(e.target.value)}
                            placeholder={`e.g. ${new Date().getFullYear()}`}
                            className={inputCls} />
                        </div>
                      )}
                    </div>
                  )}

                  {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

                  <div className="flex items-center gap-4 pt-2">
                    <button type="button" onClick={() => { setStep("role"); setError(null); }}
                      className="text-xs font-bold uppercase tracking-[0.26em] text-muted-foreground hover:text-foreground transition-colors">
                      ← Back
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={submitting}
                      className="flex items-center gap-2 px-8 py-3.5 text-xs font-bold uppercase tracking-[0.28em] bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 transition-opacity">
                      {submitting ? "Saving…" : "Set up my profile →"}
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}