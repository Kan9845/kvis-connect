"use client";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { userApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { onMeUpdateSuccess } from "@/lib/cache/invalidate";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Upload, Loader2, Check, ShieldCheck, ShieldAlert } from "lucide-react";
import { DEGREES, JOB_FIELDS, MBTI_TYPES, KVIS_YEARS } from "@/lib/constants/options";
import { CountrySelect, CitySelect, CITY_STATE_COUNTRIES } from "@/components/ui/location-selects";
import { UniversityCombobox } from "@/components/ui/university-combobox";
import { MajorCombobox } from "@/components/ui/major-combobox";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Education, Career } from "@/lib/types";
import { AvatarCustomizer } from "@/components/avatar/AvatarCustomizer";
import { AvatarPreview } from "@/components/avatar/AvatarPreview";
import { defaultAvatar } from "@/components/avatar/avatarData";
import { AvatarConfig } from "@/lib/avatarTypes";
import { cohortColor, cohortColorSoft, cohortTextColor, cohortColorHex, cohortColorSoftHex } from "@/lib/utils";

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

function SectionHead({ numeral, kicker, title }: { numeral: string; kicker: string; title: string }) {
  return (
    <header className="pt-9 pb-4">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-mono font-black text-xl tabular-nums text-[var(--kvis-green-light)]" style={{ letterSpacing: "-0.02em" }}>
          {numeral}
        </span>
        <span className="text-xs uppercase tracking-[0.28em] font-bold text-[var(--kvis-text3)]">
          {kicker}
        </span>
      </div>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-[-0.025em] leading-[1.02] text-foreground max-w-[22ch]">
        {title}
      </h2>
    </header>
  );
}

function FieldRow({ label, required, hint, error, noBorder, children }: {
  label: string; required?: boolean; hint?: string; error?: string; noBorder?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-6 gap-y-2 py-4${noBorder ? "" : " border-b border-[var(--kvis-rule)]"}`}>
      <div className="md:pt-2.5">
        <span className="text-xs uppercase tracking-[0.24em] font-bold text-[var(--kvis-text3)]">
          {label}
          {required && <span className="text-[var(--kvis-purple)]"> *</span>}
        </span>
        {hint && <p className="text-xs text-muted-foreground mt-1 normal-case tracking-normal">{hint}</p>}
      </div>
      <div className="min-w-0">
        {children}
        {error && <p className="text-xs mt-1.5 font-semibold text-[var(--kvis-purple)]">{error}</p>}
      </div>
    </div>
  );
}

const inputCls = "w-full bg-transparent border-0 border-b border-foreground/20 rounded-none px-0 py-2 text-sm md:text-base text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-foreground transition-colors";
const selectTriggerCls = "w-full bg-transparent border-0 border-b border-foreground/20 rounded-none px-0 py-2 text-sm md:text-base text-foreground focus:ring-0 focus:ring-offset-0";

export default function EditPage() {
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const router = useRouter();
  const { user: me, loading, refetch } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [picPreview, setPicPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [tab, setTab] = useState<Tab>("general");
  const [gooseConfig, setGooseConfig] = useState<AvatarConfig>(defaultAvatar);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [profileMode, setProfileMode] = useState<"upload" | "goose">("upload");

  useEffect(() => {
    if (!loading && !me) router.push("/auth/login");
  }, [loading, me, router]);

  const { register, handleSubmit, setValue, formState: { errors, isDirty, isSubmitting } } = useForm<GeneralForm>({
    resolver: zodResolver(generalSchema),
    values: me ? {
      first_name: me.first_name, last_name: me.last_name, kvis_year: me.kvis_year ?? undefined,
      place: me.place ?? "", country: me.country ?? "", bio: me.bio ?? "", mbti: me.mbti ?? "",
      interests: me.interests ?? "", facebook_url: me.facebook_url ?? "",
      linkedin_url: me.linkedin_url ?? "", line_id: me.line_id ?? "", website_url: me.website_url ?? "",
    } : undefined,
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
    let picUrl: string | undefined;
    if (pendingFile) {
      try {
        const { url } = await userApi.uploadProfilePic(pendingFile);
        picUrl = url;
        setPendingFile(null);
      } catch { toast.error("Photo upload failed"); return; }
    }
    const updated = await userApi.updateMe(picUrl ? { ...data, profile_pic_url: picUrl } : data);
    onMeUpdateSuccess(qc, updated);
    await refetch();
    toast.success("Profile updated");
  };

  const saveEducation = async () => {
    await userApi.updateEducation(education);
    await refetch();
    if (me) onMeUpdateSuccess(qc, { ...me, education: me.education });
    toast.success("Education saved");
  };

  const saveCareer = async () => {
    await userApi.updateCareer(career);
    await refetch();
    if (me) onMeUpdateSuccess(qc, { ...me, career: me.career });
    toast.success("Career saved");
  };

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    e.target.value = "";
  };

  const getCroppedFile = async (): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (!cropSrc || !croppedAreaPixels) return reject("No crop data");
      const image = new window.Image();
      image.src = cropSrc;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
        canvas.toBlob((blob) => {
          if (!blob) return reject("Blob failed");
          resolve(new File([blob], "profile.jpg", { type: "image/jpeg" }));
        }, "image/jpeg", 0.92);
      };
    });
  };

  const handleUseGooseProfile = async () => {
    if (!me) return;
    try {
      const size = 600;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      // Clip to circle
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      // Draw gradient background
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, cohortColorHex(me.kvis_year));
      grad.addColorStop(1, cohortColorSoftHex(me.kvis_year));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      const drawLayer = (src: string, scale = 1.26) =>
        new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const offset = (size * (scale - 1)) / 2;
            ctx.drawImage(img, -offset, -offset, size * scale, size * scale);
            resolve();
          };
          img.onerror = (e) => { console.warn("Failed to load", src, e); resolve(); };
          img.src = src;
        });

      const layerOrder = ["eyes", "brows", "hair", "head", "glasses", "cheek", "neck", "hand"] as const;

      await drawLayer("/goose/goose_base.png");
      for (const layer of layerOrder) {
        const asset = gooseConfig[layer];
        if (asset) await drawLayer(`/goose/${asset}.png`);
      }
      await drawLayer("/goose/layout.png");

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "goose-profile.png", { type: "image/png" });
        const { url } = await userApi.uploadProfilePic(file);
        const updated = await userApi.updateMe({ profile_pic_url: url });
        onMeUpdateSuccess(qc, updated);
        await refetch();
        setPicPreview(url);
        toast.success("Goose profile updated");
      }, "image/png");

    } catch (err: any) {
      console.error("Goose export error:", err?.message);
      toast.error("Failed to generate goose profile");
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
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
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

        <header className="pb-7 border-b border-foreground/60">
          <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 text-[var(--kvis-purple)]">
            KVIS Connect · Edit Dossier
          </p>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95] text-foreground">
            Edit profile
          </h1>
          <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-[55ch] leading-relaxed">
            Update your dossier - the page other alumni see when they look you up.
          </p>
          <div className="flex items-center gap-3 md:gap-4 mt-6 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap text-[var(--kvis-text3)]">
            <span>{me.email}</span>
            <span aria-hidden>·</span>
            <Link href={`/profile/${me.slug}`} className="hover:text-foreground transition-colors underline decoration-1 underline-offset-4">
              View public profile
            </Link>
          </div>
        </header>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="w-full">
          <TabsList className="h-auto w-full justify-start gap-7 rounded-none border-b border-[var(--kvis-rule)] bg-transparent p-0 pt-5 pb-1">
            {(["general", "education", "career"] as const).map((t) => (
              <TabsTrigger key={t} value={t} className="rounded-none bg-transparent px-0 py-1 text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-[var(--kvis-purple)] data-[state=active]:shadow-none data-[state=active]:underline data-[state=active]:underline-offset-8 data-[state=active]:decoration-2">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {tab === "general" && (
          <>
            <section>
              <SectionHead numeral="I." kicker="Portrait" title="Profile picture" />
              <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-12 py-6 border-b border-[var(--kvis-rule)] items-start">
                <div className="space-y-6 self-start">
                  <div
                    className="relative w-full max-w-[320px] rounded-full"
                    style={{
                      outline: `5px solid ${cohortColor(me.kvis_year)}`,
                      outlineOffset: "2px",
                    }}
                  >
                    <div
                      key={profileMode}
                      ref={profileMode === "goose" ? avatarRef : undefined}
                      className="relative aspect-square overflow-hidden rounded-full"
                      style={{ background: `linear-gradient(135deg, ${cohortColorHex(me.kvis_year)} 0%, ${cohortColorSoftHex(me.kvis_year)} 100%)` }}
                    >
                      {profileMode === "goose" ? (
                        <div className="absolute inset-0 scale-[1.26] origin-center pointer-events-none">
                          <AvatarPreview config={gooseConfig} backgroundColor={`linear-gradient(135deg, ${cohortColorHex(me.kvis_year)} 0%, ${cohortColorSoftHex(me.kvis_year)} 100%)`} />
                        </div>
                      ) : previewUrl ? (
                        <img src={previewUrl} alt={`${me.first_name} ${me.last_name}`} className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center font-black"
                          style={{
                            background: `linear-gradient(135deg, ${cohortColorHex(me.kvis_year)} 0%, ${cohortColorSoftHex(me.kvis_year)} 100%)`,
                            color: cohortTextColor(me.kvis_year),
                            fontSize: "clamp(2rem, 8vw, 4rem)",
                          }}
                        >
                          {initials}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                    
                <div className="w-full max-w-2xl space-y-8">
                  <div className="flex items-center gap-6 border-b border-[var(--kvis-rule)] pb-4">
                    {(["upload", "goose"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setProfileMode(mode)}
                        className="text-xs font-bold uppercase tracking-[0.28em] pb-1 transition-colors"
                        style={profileMode === mode
                          ? { color: "var(--kvis-purple)", borderBottom: "2px solid var(--kvis-purple)" }
                          : { color: "var(--kvis-text3)" }}
                      >
                        {mode === "upload" ? "Upload Photo" : "Goose Profile"}
                      </button>
                    ))}
                  </div>
                  
                  {profileMode === "upload" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-black tracking-tight mb-2">Upload a profile photo</h3>
                        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">JPG or PNG. Square images work best.</p>
                      </div>
                      {cropSrc ? (
                        <div className="space-y-4">
                          <div className="relative w-full max-w-md h-64 bg-muted overflow-hidden rounded-lg">
                            <Cropper image={cropSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)} />
                          </div>
                          <div className="flex items-center gap-3 max-w-md">
                            <span className="text-xs uppercase tracking-[0.22em] text-[var(--kvis-text3)]">Zoom</span>
                            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-foreground" />
                          </div>
                          <div className="flex gap-3">
                            <Button type="button" className="h-auto rounded-none bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2"
                              onClick={async () => {
                                try {
                                  const file = await getCroppedFile();
                                  setPendingFile(file);
                                  setPicPreview(URL.createObjectURL(file));
                                  setCropSrc(null);
                                } catch { toast.error("Crop failed"); }
                              }}>
                              <Check className="h-3.5 w-3.5" /> Apply crop
                            </Button>
                            <Button type="button" variant="outline" className="h-auto rounded-none border-foreground/30 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.28em] gap-2" onClick={() => setCropSrc(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex h-40 w-full max-w-md cursor-pointer items-center justify-center border border-dashed border-foreground/20 transition-colors hover:border-foreground/50">
                          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
                          <div className="text-center">
                            <Upload className="mx-auto mb-3 h-6 w-6" />
                            <p className="text-sm font-medium">Click to upload</p>
                          </div>
                        </label>
                      )}
                    </div>
                  )}

                  {profileMode === "goose" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-black tracking-tight mb-2">Customize your goose</h3>
                        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">Create a playful illustrated profile avatar.</p>
                      </div>
                      <div className="max-w-xl">
                        <AvatarCustomizer value={gooseConfig} onChange={setGooseConfig} />
                      </div>
                    </div>
                  )}

                  <div className="pt-8">
                    <Button
                      type="button"
                      className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 disabled:opacity-40 gap-2"
                      onClick={async () => {
                        if (profileMode === "goose") {
                          await handleUseGooseProfile();
                        } else if (pendingFile) {
                          try {
                            const { url } = await userApi.uploadProfilePic(pendingFile);
                            const updated = await userApi.updateMe({ profile_pic_url: url });
                            onMeUpdateSuccess(qc, updated);
                            await refetch();
                            setPicPreview(url);
                            setPendingFile(null);
                            toast.success("Profile picture updated");
                          } catch { toast.error("Upload failed"); }
                        }
                      }}
                      disabled={profileMode === "upload" && !pendingFile}
                    >
                      {profileMode === "goose" ? "Save goose profile" : "Save photo"}
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <SectionHead numeral="II." kicker="Credential" title="KVIS-verified badge" />
              <div className="py-5">
                <div className="border" style={{ borderColor: me.is_verified ? "var(--kvis-green-light)" : "var(--kvis-rule)" }}>
                  <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b" style={{ borderColor: me.is_verified ? "var(--kvis-green-light)" : "var(--kvis-rule)" }}>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: me.is_verified ? "var(--kvis-green-light)" : "var(--kvis-text3)" }}>
                      {me.is_verified ? "Issued · Automatic" : "No credential on file"}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums tracking-[0.2em] text-[var(--kvis-text3)]">KVIS · V01</span>
                  </div>
                  <div className="px-5 py-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 md:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 mb-2">
                        {me.is_verified
                          ? <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--kvis-green-light)]" />
                          : <ShieldAlert className="h-5 w-5 shrink-0 text-muted-foreground" />}
                        <span className="text-2xl md:text-[1.75rem] font-black tracking-[-0.025em] leading-none text-foreground">KVIS-verified</span>
                      </div>
                      <p className="text-xs font-mono tracking-wide truncate text-[var(--kvis-text3)]">
                        {me.is_verified ? `Awarded to ${me.kvis_email}` : "Not yet awarded"}
                      </p>
                    </div>
                    {!me.is_verified && (
                      <Button type="button" variant="outline" onClick={() => router.push("/auth/verify-email")} className="h-auto rounded-none border-foreground bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-foreground hover:bg-foreground hover:text-background gap-2">
                        Verify with KVIS email
                      </Button>
                    )}
                  </div>
                  <div className="px-5 py-3 border-t border-[var(--kvis-rule)]">
                    <p className="text-xs text-muted-foreground leading-relaxed truncate">
                      {me.is_verified ? "Issued automatically on @kvis.ac.th email confirmation. Not editable here." : "We send a one-time code to your @kvis.ac.th address to issue this credential."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <form onSubmit={handleSubmit(saveGeneral)}>
              <section>
                <SectionHead numeral="III." kicker="Identity" title="The basics" />
                <FieldRow label="First name" required error={errors.first_name?.message}>
                  <Input {...register("first_name")} className={inputCls} />
                </FieldRow>
                <FieldRow label="Last name" required error={errors.last_name?.message}>
                  <Input {...register("last_name")} className={inputCls} />
                </FieldRow>
                <FieldRow label="KVIS cohort">
                  <Select defaultValue={me.kvis_year ? String(me.kvis_year) : undefined} onValueChange={(v) => setValue("kvis_year", parseInt(v), { shouldDirty: true })}>
                    <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select graduation year" /></SelectTrigger>
                    <SelectContent>{KVIS_YEARS.map((y) => <SelectItem key={y.value} value={String(y.value)}>{y.label}</SelectItem>)}</SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="MBTI">
                  <Select defaultValue={me.mbti ?? undefined} onValueChange={(v) => setValue("mbti", v, { shouldDirty: true })}>
                    <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select MBTI" /></SelectTrigger>
                    <SelectContent>{MBTI_TYPES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Bio" hint="Max 500 characters.">
                  <Textarea rows={4} placeholder="Tell your fellow alumni about yourself…" {...register("bio")} className={`${inputCls} min-h-[100px]`} />
                </FieldRow>
                <FieldRow label="Tags" hint="Comma-separated.">
                  <Input placeholder="Machine Learning, Photography, Hiking" {...register("interests")} className={inputCls} />
                </FieldRow>
              </section>

              <section>
                <SectionHead numeral="IV." kicker="Location" title="Where you are" />
                <FieldRow label="City">
                  <Input placeholder="Bangkok, Thailand" {...register("place")} className={inputCls} />
                </FieldRow>
                <FieldRow label="Country">
                  <CountrySelect variant="underline" value={me.country ?? ""} onChange={(v) => setValue("country", v, { shouldDirty: true })} />
                </FieldRow>
              </section>

              <section>
                <SectionHead numeral="V." kicker="Channels" title="How to reach you" />
                <FieldRow label="Facebook"><Input placeholder="https://facebook.com/…" {...register("facebook_url")} className={inputCls} /></FieldRow>
                <FieldRow label="LinkedIn"><Input placeholder="https://linkedin.com/in/…" {...register("linkedin_url")} className={inputCls} /></FieldRow>
                <FieldRow label="Website"><Input placeholder="https://…" {...register("website_url")} className={inputCls} /></FieldRow>
                <FieldRow label="LINE ID"><Input placeholder="your.line.id" {...register("line_id")} className={inputCls} /></FieldRow>
              </section>

              <div className="pt-8 flex items-center gap-4 flex-wrap">
                <Button type="submit" disabled={isSubmitting || (!isDirty && !pendingFile)} className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 disabled:opacity-40 gap-2">
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save changes
                </Button>
                {!isDirty && !pendingFile && !isSubmitting && (
                  <span className="text-xs uppercase tracking-[0.22em] text-[var(--kvis-text3)]">No unsaved changes</span>
                )}
              </div>
            </form>
          </>
        )}

        {tab === "education" && (
          <section>
            <SectionHead numeral="I." kicker="Schooling" title="Education" />
            {education.length === 0 && (
              <div className="py-10 border-b border-[var(--kvis-rule)] text-sm text-muted-foreground italic">No education added yet.</div>
            )}
            <div>
              {education.map((edu, i) => (
                <div key={i} className="py-7">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-baseline gap-3">
                      <span className="text-xs font-mono tabular-nums font-semibold text-[var(--kvis-text3)]">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)]">Education</span>
                    </div>
                    <button type="button" onClick={() => setEducation((prev) => prev.filter((_, j) => j !== i))} className="text-xs font-bold uppercase tracking-[0.22em] inline-flex items-center gap-1.5 hover:text-foreground transition-colors text-[var(--kvis-text3)]">
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                  <FieldRow label="University">
                    <UniversityCombobox variant="underline" value={edu.uni_name} onChange={(v) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, uni_name: v } : x))} onCountryChange={(c) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, country: c } : x))} />
                  </FieldRow>
                  <FieldRow label="Degree">
                    <Select value={edu.degree} onValueChange={(v) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, degree: v } : x))}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select degree" /></SelectTrigger>
                      <SelectContent>{DEGREES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </FieldRow>
                  <FieldRow label="Major">
                    <MajorCombobox variant="underline" value={edu.major} onChange={(v) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, major: v } : x))} />
                  </FieldRow>
                  <FieldRow label="Country">
                    <CountrySelect variant="underline" value={edu.country} onChange={(v) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, country: v, state: CITY_STATE_COUNTRIES.has(v) ? v : "" } : x))} />
                  </FieldRow>
                  {!CITY_STATE_COUNTRIES.has(edu.country) && (
                    <FieldRow label="City">
                      <CitySelect variant="underline" country={edu.country} value={edu.state ?? ""} onChange={(v) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, state: v } : x))} />
                    </FieldRow>
                  )}
                  <FieldRow label="Scholarship" hint="Optional.">
                    <Input placeholder="e.g. DPST" value={edu.scholarship ?? ""} onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, scholarship: e.target.value } : x))} className={inputCls} />
                  </FieldRow>
                  <FieldRow label="Years" hint="Optional.">
                    <div className="flex items-center gap-3">
                      <Input type="number" placeholder="From" value={edu.start_year ?? ""} onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, start_year: parseInt(e.target.value) || undefined } : x))} className={`${inputCls} w-16`} />
                      <span className="text-xs font-bold uppercase tracking-[0.2em] shrink-0 text-[var(--kvis-text3)]">to</span>
                      <Input type="number" placeholder="To" value={edu.end_year ?? ""} onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, end_year: parseInt(e.target.value) || undefined } : x))} className={`${inputCls} w-16`} />
                    </div>
                  </FieldRow>
                </div>
              ))}
            </div>
            <div className="pt-8 flex items-center gap-4 flex-wrap">
              <Button type="button" onClick={saveEducation} className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 disabled:opacity-40 gap-2">
                <Check className="h-3.5 w-3.5" /> Save education
              </Button>
              <Button type="button" variant="outline" onClick={() => setEducation((prev) => [...prev, { uni_name: "", degree: "", major: "", country: "" }])} className="h-auto rounded-none border-foreground bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-foreground hover:bg-foreground hover:text-background gap-2">
                <Plus className="h-3.5 w-3.5" /> Add entry
              </Button>
            </div>
          </section>
        )}

        {tab === "career" && (
          <section>
            <SectionHead numeral="I." kicker="Work" title="What you do" />
            {career.length === 0 && (
              <div className="py-10 border-b border-[var(--kvis-rule)] text-sm text-muted-foreground italic">No positions added yet.</div>
            )}
            <div>
              {career.map((job, i) => (
                <div key={i} className="py-7">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-baseline gap-3">
                      <span className="text-xs font-mono tabular-nums font-semibold text-[var(--kvis-text3)]">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)]">Position</span>
                      {job.is_current && (
                        <Badge className="rounded-none border-transparent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em] leading-none text-white bg-[var(--kvis-green-light)] hover:bg-[var(--kvis-green-light)]">
                          Current
                        </Badge>
                      )}
                    </div>
                    <button type="button" onClick={() => setCareer((prev) => prev.filter((_, j) => j !== i))} className="text-xs font-bold uppercase tracking-[0.22em] inline-flex items-center gap-1.5 hover:text-foreground transition-colors text-[var(--kvis-text3)]">
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                  <FieldRow label="Job title">
                    <Input placeholder="e.g. ML Engineer" value={job.job_title} onChange={(e) => setCareer((prev) => prev.map((x, j) => j === i ? { ...x, job_title: e.target.value } : x))} className={inputCls} />
                  </FieldRow>
                  <FieldRow label="Employer">
                    <Input placeholder="e.g. Google" value={job.employer} onChange={(e) => setCareer((prev) => prev.map((x, j) => j === i ? { ...x, employer: e.target.value } : x))} className={inputCls} />
                  </FieldRow>
                  <FieldRow label="Field">
                    <Select value={job.job_field} onValueChange={(v) => setCareer((prev) => prev.map((x, j) => j === i ? { ...x, job_field: v } : x))}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select field" /></SelectTrigger>
                      <SelectContent>{JOB_FIELDS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </FieldRow>
                  <FieldRow label="Country">
                    <CountrySelect variant="underline" value={job.country} onChange={(v) => setCareer((prev) => prev.map((x, j) => j === i ? { ...x, country: v, state: CITY_STATE_COUNTRIES.has(v) ? v : "" } : x))} />
                  </FieldRow>
                  {!CITY_STATE_COUNTRIES.has(job.country) && (
                    <FieldRow label="City">
                      <CitySelect variant="underline" country={job.country} value={job.state ?? ""} onChange={(v) => setCareer((prev) => prev.map((x, j) => j === i ? { ...x, state: v } : x))} />
                    </FieldRow>
                  )}
                  <FieldRow label="Years" hint="Optional.">
                    <div className="flex items-center gap-3">
                      <Input type="number" placeholder="From" value={job.start_year ?? ""} onChange={(e) => setCareer((prev) => prev.map((x, j) => j === i ? { ...x, start_year: parseInt(e.target.value) || undefined, ...(!(parseInt(e.target.value) || undefined) && { is_current: false, end_year: undefined }) } : x))} className={`${inputCls} w-16`} />
                      <span className="text-xs font-bold uppercase tracking-[0.2em] shrink-0 text-[var(--kvis-text3)]">to</span>
                      <Input type="number" placeholder="To" value={job.is_current ? new Date().getFullYear() : (job.end_year ?? "")} disabled={job.is_current} onChange={(e) => setCareer((prev) => prev.map((x, j) => j === i ? { ...x, end_year: parseInt(e.target.value) || undefined } : x))} className={`${inputCls} w-24 disabled:opacity-40`} />
                    </div>
                  </FieldRow>
                  {job.start_year && (
                    <FieldRow label="Status">
                      <label className="inline-flex items-center gap-2.5 text-sm text-foreground cursor-pointer pt-1.5">
                        <input type="checkbox" checked={job.is_current} onChange={(e) => setCareer((prev) => prev.map((x, j) => j === i ? { ...x, is_current: e.target.checked } : x))} className="h-4 w-4 accent-foreground" />
                        <span className="text-sm">I currently work here</span>
                      </label>
                    </FieldRow>
                  )}
                </div>
              ))}
            </div>
            <div className="pt-8 flex items-center gap-4 flex-wrap">
              <Button type="button" onClick={saveCareer} className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 disabled:opacity-40 gap-2">
                <Check className="h-3.5 w-3.5" /> Save career
              </Button>
              <Button type="button" variant="outline" onClick={() => setCareer((prev) => [...prev, { job_title: "", employer: "", job_field: "", country: "", is_current: false }])} className="h-auto rounded-none border-foreground bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-foreground hover:bg-foreground hover:text-background gap-2">
                <Plus className="h-3.5 w-3.5" /> Add entry
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}