"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { userApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { onMeUpdateSuccess } from "@/lib/cache/invalidate";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Trash2,
  Upload,
  Loader2,
  Check,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import {
  DEGREES,
  JOB_FIELDS,
  MBTI_TYPES,
  KVIS_YEARS,
} from "@/lib/constants/options";
import { COUNTRIES } from "@/lib/constants/countries";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Education, Career } from "@/lib/types";

const P = {
  purple: "oklch(44% 0.26 294)",
  purpleSoft: "oklch(95% 0.035 294)",
  green: "oklch(40% 0.16 148)",
  text3: "oklch(62% 0.005 294)",
  rule: "oklch(90% 0.007 294)",
};

const generalSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  kvis_year: z.coerce.number().optional(),
  place: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().max(500).optional(),
  mbti: z.string().optional(),
  interests: z.string().optional(),
  facebook_url: z.string().optional(),
  linkedin_url: z.string().optional(),
  line_id: z.string().optional(),
  website_url: z.string().optional(),
});

type GeneralForm = z.infer<typeof generalSchema>;
type Tab = "general" | "education" | "career";


function SectionHead({
  numeral,
  kicker,
  title,
}: {
  numeral: string;
  kicker: string;
  title: string;
}) {
  return (
    <header className="pt-9 pb-4">
      <div className="flex items-baseline gap-3 mb-2">
        <span
          className="font-mono font-black text-xl tabular-nums"
          style={{ color: P.green, letterSpacing: "-0.02em" }}
        >
          {numeral}
        </span>
        <span
          className="text-xs uppercase tracking-[0.28em] font-bold"
          style={{ color: P.text3 }}
        >
          {kicker}
        </span>
      </div>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-[-0.025em] leading-[1.02] text-foreground max-w-[22ch]">
        {title}
      </h2>
    </header>
  );
}

function FieldRow({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-6 gap-y-2 py-4 border-b"
      style={{ borderColor: P.rule }}
    >
      <div className="md:pt-2.5">
        <span
          className="text-xs uppercase tracking-[0.24em] font-bold"
          style={{ color: P.text3 }}
        >
          {label}
          {required && <span style={{ color: P.purple }}> *</span>}
        </span>
        {hint && (
          <p className="text-[11px] text-muted-foreground mt-1 normal-case tracking-normal">
            {hint}
          </p>
        )}
      </div>
      <div className="min-w-0">
        {children}
        {error && (
          <p className="text-xs mt-1.5 font-semibold" style={{ color: P.purple }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}


const inputCls =
  "w-full bg-transparent border-0 border-b border-foreground/20 rounded-none px-0 py-2 text-sm md:text-base text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-foreground transition-colors";

const selectTriggerCls =
  "w-full bg-transparent border-0 border-b border-foreground/20 rounded-none px-0 py-2 text-sm md:text-base text-foreground focus:ring-0 focus:ring-offset-0";

export default function EditPage() {
  const router = useRouter();
  const { user: me, loading, refetch } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [picPreview, setPicPreview] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("general");

  useEffect(() => {
    if (!loading && !me) router.push("/auth/login");
  }, [loading, me, router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<GeneralForm>({
    resolver: zodResolver(generalSchema),
    values: me
      ? {
          first_name: me.first_name,
          last_name: me.last_name,
          kvis_year: me.kvis_year ?? undefined,
          place: me.place ?? "",
          country: me.country ?? "",
          bio: me.bio ?? "",
          mbti: me.mbti ?? "",
          interests: me.interests ?? "",
          facebook_url: me.facebook_url ?? "",
          linkedin_url: me.linkedin_url ?? "",
          line_id: me.line_id ?? "",
          website_url: me.website_url ?? "",
        }
      : undefined,
  });

  const [education, setEducation] = useState<Omit<Education, "id">[]>([]);
  const [career, setCareer] = useState<Omit<Career, "id">[]>([]);

  useEffect(() => {
    if (me) {
      setEducation(me.education.map(({ id: _id, ...rest }) => rest));
      setCareer(me.career.map(({ id: _id, ...rest }) => rest));
    }
  }, [me]);

  const saveGeneral = async (data: GeneralForm) => {
    const updated = await userApi.updateMe(data);
    onMeUpdateSuccess(qc, updated);
    await refetch();
    toast({ title: "Profile updated" });
  };

  const saveEducation = async () => {
    await userApi.updateEducation(education);
    await refetch();
    // refetch updates AuthContext; sync the RQ cache afterward if me is available
    if (me) onMeUpdateSuccess(qc, { ...me, education: me.education });
    toast({ title: "Education saved" });
  };

  const saveCareer = async () => {
    await userApi.updateCareer(career);
    await refetch();
    if (me) onMeUpdateSuccess(qc, { ...me, career: me.career });
    toast({ title: "Career saved" });
  };

  const handlePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicPreview(URL.createObjectURL(file));
    try {
      const { url } = await userApi.uploadProfilePic(file);
      await userApi.updateMe({ profile_pic_url: url });
      // Fetch fresh me to get full updated user, then hydrate cache.
      const fresh = await userApi.getMe();
      onMeUpdateSuccess(qc, fresh);
      await refetch();
      toast({ title: "Profile picture updated" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  if (loading || !me) {
    return (
      <div className="min-h-full bg-background">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-10 lg:py-14">
          <Skeleton className="h-4 w-48 mb-4" />
          <Skeleton className="h-20 w-3/4 mb-6" />
          <Skeleton className="h-10 w-full mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const initials = `${me.first_name[0] ?? ""}${me.last_name[0] ?? ""}`.toUpperCase();
  const previewUrl = picPreview ?? me.profile_pic_url ?? "";

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-5xl px-6 lg:px-10 py-10 lg:py-14">
        {/* Masthead */}
        <header className="pb-7 border-b border-foreground/60">
          <p
            className="text-xs font-bold uppercase tracking-[0.3em] mb-3"
            style={{ color: P.purple }}
          >
            KVIS Connect · Edit Dossier
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95] text-foreground">
            Edit profile
          </h1>
          <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-[55ch] leading-relaxed">
            Update your dossier — the page other alumni see when they look you up.
          </p>
          <div
            className="flex items-center gap-3 md:gap-4 mt-6 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap"
            style={{ color: P.text3 }}
          >
            <span>{me.email}</span>
            <span aria-hidden>·</span>
            <Link
              href={`/profile/${me.slug}`}
              className="hover:text-foreground transition-colors underline decoration-1 underline-offset-4"
            >
              View public profile
            </Link>
          </div>
        </header>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="w-full">
          <TabsList
            className="h-auto w-full justify-start gap-7 rounded-none border-b bg-transparent p-0 pt-5 pb-1"
            style={{ borderColor: P.rule }}
          >
            <TabsTrigger
              value="general"
              className="rounded-none bg-transparent px-0 py-1 text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-[oklch(44%_0.26_294)] data-[state=active]:shadow-none data-[state=active]:underline data-[state=active]:underline-offset-8 data-[state=active]:decoration-2"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="education"
              className="rounded-none bg-transparent px-0 py-1 text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-[oklch(44%_0.26_294)] data-[state=active]:shadow-none data-[state=active]:underline data-[state=active]:underline-offset-8 data-[state=active]:decoration-2"
            >
              Education
            </TabsTrigger>
            <TabsTrigger
              value="career"
              className="rounded-none bg-transparent px-0 py-1 text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-[oklch(44%_0.26_294)] data-[state=active]:shadow-none data-[state=active]:underline data-[state=active]:underline-offset-8 data-[state=active]:decoration-2"
            >
              Career
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* GENERAL TAB */}
        {tab === "general" && (
          <>
            {/* I. Portrait */}
            <section>
              <SectionHead numeral="I." kicker="Portrait" title="Profile picture" />
              <div
                className="grid grid-cols-[100px_1fr] md:grid-cols-[140px_1fr] gap-6 md:gap-8 items-center py-4 border-b"
                style={{ borderColor: P.rule }}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt={`${me.first_name} ${me.last_name}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-white font-black"
                      style={{
                        background: P.purple,
                        fontSize: "clamp(1.75rem, 6vw, 3rem)",
                      }}
                    >
                      {initials}
                    </div>
                  )}
                </div>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    className="h-auto rounded-none border-foreground bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-foreground hover:bg-foreground hover:text-background gap-2"
                  >
                    <Upload className="h-3.5 w-3.5" /> Change photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3 max-w-[40ch]">
                    Square images work best. JPG or PNG, up to ~5MB.
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePicChange}
                  />
                </div>
              </div>
            </section>

            {/* II. Credential — auto-awarded, not editable */}
            <section>
              <SectionHead
                numeral="II."
                kicker="Credential"
                title="KVIS-verified badge"
              />
              <div className="py-5">
                <div
                  className="border"
                  style={{
                    borderColor: me.is_verified ? P.green : P.rule,
                  }}
                >
                  {/* Top strap — credential status + serial */}
                  <div
                    className="flex items-center justify-between gap-3 px-5 py-2.5 border-b"
                    style={{
                      borderColor: me.is_verified ? P.green : P.rule,
                    }}
                  >
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.3em]"
                      style={{ color: me.is_verified ? P.green : P.text3 }}
                    >
                      {me.is_verified
                        ? "Issued · Automatic"
                        : "No credential on file"}
                    </span>
                    <span
                      className="text-[10px] font-mono tabular-nums tracking-[0.2em]"
                      style={{ color: P.text3 }}
                    >
                      KVIS · V01
                    </span>
                  </div>

                  {/* Body */}
                  <div className="px-5 py-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 md:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 mb-2">
                        {me.is_verified ? (
                          <ShieldCheck
                            className="h-5 w-5 shrink-0"
                            style={{ color: P.green }}
                          />
                        ) : (
                          <ShieldAlert className="h-5 w-5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="text-2xl md:text-[1.75rem] font-black tracking-[-0.025em] leading-none text-foreground">
                          KVIS-verified
                        </span>
                      </div>
                      <p
                        className="text-xs font-mono tracking-wide truncate"
                        style={{ color: P.text3 }}
                      >
                        {me.is_verified
                          ? `Awarded to ${me.kvis_email}`
                          : "Not yet awarded"}
                      </p>
                    </div>

                    {!me.is_verified && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/auth/verify-email")}
                        className="h-auto rounded-none border-foreground bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-foreground hover:bg-foreground hover:text-background gap-2"
                      >
                        Verify with KVIS email
                      </Button>
                    )}
                  </div>

                  {/* Footnote — explains automatic issuance */}
                  <div
                    className="px-5 py-3 border-t"
                    style={{ borderColor: P.rule }}
                  >
                    <p className="text-[11px] text-muted-foreground leading-relaxed truncate">
                      {me.is_verified
                        ? "Issued automatically on @kvis.ac.th email confirmation. Not editable here."
                        : "We send a one-time code to your @kvis.ac.th address to issue this credential."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <form onSubmit={handleSubmit(saveGeneral)}>
              {/* III. Basics */}
              <section>
                <SectionHead
                  numeral="III."
                  kicker="Identity"
                  title="The basics"
                />
                <FieldRow
                  label="First name"
                  required
                  error={errors.first_name?.message}
                >
                  <Input {...register("first_name")} className={inputCls} />
                </FieldRow>
                <FieldRow
                  label="Last name"
                  required
                  error={errors.last_name?.message}
                >
                  <Input {...register("last_name")} className={inputCls} />
                </FieldRow>
                <FieldRow label="KVIS cohort">
                  <Select
                    defaultValue={me.kvis_year ? String(me.kvis_year) : undefined}
                    onValueChange={(v) => setValue("kvis_year", parseInt(v), { shouldDirty: true })}
                  >
                    <SelectTrigger className={selectTriggerCls}>
                      <SelectValue placeholder="Select graduation year" />
                    </SelectTrigger>
                    <SelectContent>
                      {KVIS_YEARS.map((y) => (
                        <SelectItem key={y.value} value={String(y.value)}>
                          {y.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="MBTI">
                  <Select
                    defaultValue={me.mbti ?? undefined}
                    onValueChange={(v) => setValue("mbti", v, { shouldDirty: true })}
                  >
                    <SelectTrigger className={selectTriggerCls}>
                      <SelectValue placeholder="Select MBTI" />
                    </SelectTrigger>
                    <SelectContent>
                      {MBTI_TYPES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Bio" hint="Max 500 characters.">
                  <Textarea
                    rows={4}
                    placeholder="Tell your fellow alumni about yourself…"
                    {...register("bio")}
                    className={`${inputCls} min-h-[100px]`}
                  />
                </FieldRow>
                <FieldRow label="Tags" hint="Comma-separated.">
                  <Input
                    placeholder="Machine Learning, Photography, Hiking"
                    {...register("interests")}
                    className={inputCls}
                  />
                </FieldRow>
              </section>

              {/* IV. Location */}
              <section>
                <SectionHead numeral="IV." kicker="Location" title="Where you are" />
                <FieldRow label="City">
                  <Input
                    placeholder="Bangkok, Thailand"
                    {...register("place")}
                    className={inputCls}
                  />
                </FieldRow>
                <FieldRow label="Country">
                  <Select
                    defaultValue={me.country ?? undefined}
                    onValueChange={(v) => setValue("country", v, { shouldDirty: true })}
                  >
                    <SelectTrigger className={selectTriggerCls}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>
              </section>

              {/* V. Channels */}
              <section>
                <SectionHead
                  numeral="V."
                  kicker="Channels"
                  title="How to reach you"
                />
                <FieldRow label="Facebook">
                  <Input
                    placeholder="https://facebook.com/…"
                    {...register("facebook_url")}
                    className={inputCls}
                  />
                </FieldRow>
                <FieldRow label="LinkedIn">
                  <Input
                    placeholder="https://linkedin.com/in/…"
                    {...register("linkedin_url")}
                    className={inputCls}
                  />
                </FieldRow>
                <FieldRow label="Website">
                  <Input
                    placeholder="https://…"
                    {...register("website_url")}
                    className={inputCls}
                  />
                </FieldRow>
                <FieldRow label="LINE ID">
                  <Input
                    placeholder="your.line.id"
                    {...register("line_id")}
                    className={inputCls}
                  />
                </FieldRow>
              </section>

              <div className="pt-8 flex items-center gap-4 flex-wrap">
                <Button
                  type="submit"
                  disabled={isSubmitting || !isDirty}
                  className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 disabled:opacity-40 gap-2"
                >
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save changes
                </Button>
                {!isDirty && !isSubmitting && (
                  <span
                    className="text-xs uppercase tracking-[0.22em]"
                    style={{ color: P.text3 }}
                  >
                    No unsaved changes
                  </span>
                )}
              </div>
            </form>
          </>
        )}

        {/* EDUCATION TAB */}
        {tab === "education" && (
          <section>
            <SectionHead
              numeral="I."
              kicker="Schooling"
              title="Where you studied"
            />

            {education.length === 0 && (
              <div
                className="py-10 border-b text-sm text-muted-foreground italic"
                style={{ borderColor: P.rule }}
              >
                No education added yet.
              </div>
            )}

            <div>
              {education.map((edu, i) => (
                <div
                  key={i}
                  className="py-7 border-b"
                  style={{ borderColor: P.rule }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-baseline gap-3">
                      <span
                        className="text-xs font-mono tabular-nums font-semibold"
                        style={{ color: P.text3 }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="text-xs uppercase tracking-[0.26em] font-bold"
                        style={{ color: P.text3 }}
                      >
                        Education
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEducation((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="text-xs font-bold uppercase tracking-[0.22em] inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                      style={{ color: P.text3 }}
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>

                  <FieldRow label="University">
                    <Input
                      placeholder="e.g. Massachusetts Institute of Technology"
                      value={edu.uni_name}
                      onChange={(e) =>
                        setEducation((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, uni_name: e.target.value } : x,
                          ),
                        )
                      }
                      className={inputCls}
                    />
                  </FieldRow>
                  <FieldRow label="Degree">
                    <Select
                      value={edu.degree}
                      onValueChange={(v) =>
                        setEducation((prev) =>
                          prev.map((x, j) => (j === i ? { ...x, degree: v } : x)),
                        )
                      }
                    >
                      <SelectTrigger className={selectTriggerCls}>
                        <SelectValue placeholder="Select degree" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEGREES.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  <FieldRow label="Major">
                    <Input
                      placeholder="e.g. Computer Science"
                      value={edu.major}
                      onChange={(e) =>
                        setEducation((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, major: e.target.value } : x,
                          ),
                        )
                      }
                      className={inputCls}
                    />
                  </FieldRow>
                  <FieldRow label="Country">
                    <Select
                      value={edu.country}
                      onValueChange={(v) =>
                        setEducation((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, country: v } : x,
                          ),
                        )
                      }
                    >
                      <SelectTrigger className={selectTriggerCls}>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  <FieldRow label="Scholarship" hint="Optional.">
                    <Input
                      placeholder="e.g. DPST"
                      value={edu.scholarship ?? ""}
                      onChange={(e) =>
                        setEducation((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, scholarship: e.target.value } : x,
                          ),
                        )
                      }
                      className={inputCls}
                    />
                  </FieldRow>
                  <FieldRow label="Years">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        placeholder="Start year"
                        value={edu.start_year ?? ""}
                        onChange={(e) =>
                          setEducation((prev) =>
                            prev.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    start_year:
                                      parseInt(e.target.value) || undefined,
                                  }
                                : x,
                            ),
                          )
                        }
                        className={inputCls}
                      />
                      <Input
                        type="number"
                        placeholder="End year"
                        value={edu.end_year ?? ""}
                        onChange={(e) =>
                          setEducation((prev) =>
                            prev.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    end_year:
                                      parseInt(e.target.value) || undefined,
                                  }
                                : x,
                            ),
                          )
                        }
                        className={inputCls}
                      />
                    </div>
                  </FieldRow>
                </div>
              ))}
            </div>

            <div className="pt-8 flex items-center gap-4 flex-wrap">
              <Button
                type="button"
                onClick={saveEducation}
                className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 disabled:opacity-40 gap-2"
              >
                <Check className="h-3.5 w-3.5" /> Save education
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setEducation((prev) => [
                    ...prev,
                    {
                      uni_name: "",
                      degree: "",
                      major: "",
                      country: "",
                    },
                  ])
                }
                className="h-auto rounded-none border-foreground bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-foreground hover:bg-foreground hover:text-background gap-2"
              >
                <Plus className="h-3.5 w-3.5" /> Add entry
              </Button>
            </div>
          </section>
        )}

        {/* CAREER TAB */}
        {tab === "career" && (
          <section>
            <SectionHead numeral="I." kicker="Work" title="What you do" />

            {career.length === 0 && (
              <div
                className="py-10 border-b text-sm text-muted-foreground italic"
                style={{ borderColor: P.rule }}
              >
                No positions added yet.
              </div>
            )}

            <div>
              {career.map((job, i) => (
                <div
                  key={i}
                  className="py-7 border-b"
                  style={{ borderColor: P.rule }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-baseline gap-3">
                      <span
                        className="text-xs font-mono tabular-nums font-semibold"
                        style={{ color: P.text3 }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="text-xs uppercase tracking-[0.26em] font-bold"
                        style={{ color: P.text3 }}
                      >
                        Position
                      </span>
                      {job.is_current && (
                        <Badge
                          className="rounded-none border-transparent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em] leading-none text-white hover:bg-[oklch(40%_0.16_148)]"
                          style={{ background: P.green }}
                        >
                          Current
                        </Badge>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCareer((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="text-xs font-bold uppercase tracking-[0.22em] inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                      style={{ color: P.text3 }}
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>

                  <FieldRow label="Job title">
                    <Input
                      placeholder="e.g. ML Engineer"
                      value={job.job_title}
                      onChange={(e) =>
                        setCareer((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, job_title: e.target.value } : x,
                          ),
                        )
                      }
                      className={inputCls}
                    />
                  </FieldRow>
                  <FieldRow label="Employer">
                    <Input
                      placeholder="e.g. Google"
                      value={job.employer}
                      onChange={(e) =>
                        setCareer((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, employer: e.target.value } : x,
                          ),
                        )
                      }
                      className={inputCls}
                    />
                  </FieldRow>
                  <FieldRow label="Field">
                    <Select
                      value={job.job_field}
                      onValueChange={(v) =>
                        setCareer((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, job_field: v } : x,
                          ),
                        )
                      }
                    >
                      <SelectTrigger className={selectTriggerCls}>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {JOB_FIELDS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  <FieldRow label="Country">
                    <Select
                      value={job.country}
                      onValueChange={(v) =>
                        setCareer((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, country: v } : x,
                          ),
                        )
                      }
                    >
                      <SelectTrigger className={selectTriggerCls}>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  <FieldRow label="Years">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        placeholder="Start year"
                        value={job.start_year ?? ""}
                        onChange={(e) =>
                          setCareer((prev) =>
                            prev.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    start_year:
                                      parseInt(e.target.value) || undefined,
                                  }
                                : x,
                            ),
                          )
                        }
                        className={inputCls}
                      />
                      <Input
                        type="number"
                        placeholder="End year"
                        value={job.end_year ?? ""}
                        disabled={job.is_current}
                        onChange={(e) =>
                          setCareer((prev) =>
                            prev.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    end_year:
                                      parseInt(e.target.value) || undefined,
                                  }
                                : x,
                            ),
                          )
                        }
                        className={`${inputCls} disabled:opacity-40`}
                      />
                    </div>
                  </FieldRow>
                  <FieldRow label="Status">
                    <label className="inline-flex items-center gap-2.5 text-sm text-foreground cursor-pointer pt-1.5">
                      <input
                        type="checkbox"
                        checked={job.is_current}
                        onChange={(e) =>
                          setCareer((prev) =>
                            prev.map((x, j) =>
                              j === i
                                ? { ...x, is_current: e.target.checked }
                                : x,
                            ),
                          )
                        }
                        className="h-4 w-4 accent-foreground"
                      />
                      <span className="text-sm">I currently work here</span>
                    </label>
                  </FieldRow>
                </div>
              ))}
            </div>

            <div className="pt-8 flex items-center gap-4 flex-wrap">
              <Button
                type="button"
                onClick={saveCareer}
                className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 disabled:opacity-40 gap-2"
              >
                <Check className="h-3.5 w-3.5" /> Save career
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setCareer((prev) => [
                    ...prev,
                    {
                      job_title: "",
                      employer: "",
                      job_field: "",
                      country: "",
                      is_current: false,
                    },
                  ])
                }
                className="h-auto rounded-none border-foreground bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-foreground hover:bg-foreground hover:text-background gap-2"
              >
                <Plus className="h-3.5 w-3.5" /> Add entry
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
