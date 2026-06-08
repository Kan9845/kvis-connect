"use client";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useRef } from "react";
import type { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from "react-hook-form";
import type { UserMe } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Upload,
  Loader2,
  Check,
  ShieldCheck,
  ShieldAlert,
  Dot,
} from "lucide-react";
import {
  MBTI_TYPES,
  KVIS_YEARS,
  KVIS_DEPARTMENTS,
} from "@/lib/constants/options";
import {
  CountrySelect,
} from "@/components/ui/location-selects";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AvatarCustomizer } from "@/components/avatar/AvatarCustomizer";
import { AvatarPreview } from "@/components/avatar/AvatarPreview";
import { AvatarConfig } from "@/lib/avatarTypes";
import { cohortColorHex, isFaculty } from "@/lib/utils";
import { userApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { onMeUpdateSuccess } from "@/lib/cache/invalidate";
import type { GeneralForm } from "./schema";
import {
  SectionHead,
  FieldRow,
  PrivacyToggle,
  inputCls,
  selectTriggerCls,
} from "./components";
import {
  CURRENT_STATUS_OPTIONS,
  CONTACT_TYPES,
} from "./constants";

interface TabGeneralProps {
  me: UserMe;
  refetch: () => Promise<void>;
  isSetup: boolean;
  isStudent: boolean;
  isFacultyUser: boolean;
  isAlumni: boolean;
  notify: { success: (msg: string) => void; error: (msg: string) => void };
  // form
  register: UseFormRegister<GeneralForm>;
  watch: UseFormWatch<GeneralForm>;
  setValue: UseFormSetValue<GeneralForm>;
  errors: FieldErrors<GeneralForm>;
  isSubmitting: boolean;
  isDirty: boolean;
  handleSubmit: (fn: (data: GeneralForm) => Promise<void>) => (e?: React.BaseSyntheticEvent) => Promise<void>;
  saveGeneral: (data: GeneralForm) => Promise<void>;
  // pic / crop
  cropSrc: string | null;
  setCropSrc: React.Dispatch<React.SetStateAction<string | null>>;
  crop: { x: number; y: number };
  setCrop: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  croppedAreaPixels: Area | null;
  setCroppedAreaPixels: React.Dispatch<React.SetStateAction<Area | null>>;
  picPreview: string | null;
  setPicPreview: React.Dispatch<React.SetStateAction<string | null>>;
  pendingFile: File | null;
  setPendingFile: React.Dispatch<React.SetStateAction<File | null>>;
  profileMode: "upload" | "goose";
  setProfileMode: React.Dispatch<React.SetStateAction<"upload" | "goose">>;
  gooseConfig: AvatarConfig;
  setGooseConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  avatarRef: React.RefObject<HTMLDivElement>;
  getCroppedFile: () => Promise<File>;
  handleUseGooseProfile: () => Promise<void>;
  handlePicChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  extraContacts: { type: string; value: string; public: boolean }[];
  setExtraContacts: React.Dispatch<React.SetStateAction<{ type: string; value: string; public: boolean }[]>>;
  watchNicknamePublic: boolean;
  watchInterestsPublic: boolean;
  watchContactEmailPublic: boolean;
}

export function TabGeneral({
  me,
  refetch,
  isSetup,
  isStudent,
  isFacultyUser,
  isAlumni,
  notify,
  register,
  watch,
  setValue,
  errors,
  isSubmitting,
  isDirty,
  handleSubmit,
  saveGeneral,
  cropSrc,
  setCropSrc,
  crop,
  setCrop,
  zoom,
  setZoom,
  croppedAreaPixels,
  setCroppedAreaPixels,
  picPreview,
  setPicPreview,
  pendingFile,
  setPendingFile,
  profileMode,
  setProfileMode,
  gooseConfig,
  setGooseConfig,
  avatarRef,
  getCroppedFile,
  handleUseGooseProfile,
  handlePicChange,
  extraContacts,
  setExtraContacts,
  watchNicknamePublic,
  watchInterestsPublic,
  watchContactEmailPublic,
}: TabGeneralProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const initials =
    `${me.first_name[0] ?? ""}${me.last_name[0] ?? ""}`.toUpperCase();
  const previewUrl = picPreview ?? me.profile_pic_url ?? "";

  return (
    <>
      {/* Portrait section */}
      <section>
        <SectionHead
          numeral="I."
          kicker="Portrait"
          title="Profile picture"
        />
        <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-section py-lg border-b border-[var(--kvis-border)] items-start">
          <div className="space-y-lg self-start">
            <div className="relative w-full max-w-[320px]">
              <div
                key={profileMode}
                ref={profileMode === "goose" ? avatarRef : undefined}
                className="relative aspect-square overflow-hidden"
                style={{ background: cohortColorHex(me.kvis_year) }}
              >
                {profileMode === "goose" ? (
                  <div className="absolute inset-0 scale-[1.26] origin-center pointer-events-none">
                    <AvatarPreview
                      config={gooseConfig}
                      backgroundColor={cohortColorHex(me.kvis_year)}
                    />
                  </div>
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={`${me.first_name} ${me.last_name}`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center font-black"
                    style={{
                      background: cohortColorHex(me.kvis_year),
                      color: "white",
                      fontSize: "clamp(2rem, 8vw, 4rem)",
                    }}
                  >
                    {initials}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="w-full max-w-2xl space-y-xl">
            <div className="flex items-center gap-lg border-b border-[var(--kvis-border)] pb-md">
              {(["upload", "goose"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setProfileMode(mode)}
                  className="text-xs font-bold uppercase tracking-[0.28em] pb-1 transition-colors"
                  style={
                    profileMode === mode
                      ? {
                          color: "var(--kvis-purple)",
                          borderBottom: "2px solid var(--kvis-purple)",
                        }
                      : { color: "var(--kvis-text3)" }
                  }
                >
                  {mode === "upload" ? "Upload Photo" : "Goose Profile"}
                </button>
              ))}
            </div>
            {profileMode === "upload" && (
              <div className="space-y-lg">
                <div>
                  <h3 className="text-xl font-black tracking-tight mb-2">
                    Upload a profile photo
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                    JPG or PNG. Square images work best.
                  </p>
                </div>
                {cropSrc ? (
                  <div className="space-y-4">
                    <div className="relative w-full max-w-md h-64 bg-muted overflow-hidden rounded-lg">
                      <Cropper
                        image={cropSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={(_, areaPixels) =>
                          setCroppedAreaPixels(areaPixels)
                        }
                      />
                    </div>
                    <div className="flex items-center gap-3 max-w-md">
                      <span className="text-xs uppercase tracking-[0.22em] text-[var(--kvis-text3)]">
                        Zoom
                      </span>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 accent-foreground"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        className="h-auto rounded-none bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2"
                        onClick={async () => {
                          try {
                            const file = await getCroppedFile();
                            setPendingFile(file);
                            setPicPreview(URL.createObjectURL(file));
                            setCropSrc(null);
                          } catch {
                            notify.error("Crop failed");
                          }
                        }}
                      >
                        <Check className="h-3.5 w-3.5" /> Apply crop
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto rounded-none border-foreground/30 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.28em] gap-2"
                        onClick={() => setCropSrc(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex h-40 w-full max-w-md cursor-pointer items-center justify-center border border-dashed border-foreground/20 transition-colors hover:border-foreground/50">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePicChange}
                    />
                    <div className="text-center">
                      <Upload className="mx-auto mb-3 h-6 w-6" />
                      <p className="text-sm font-medium">
                        Click to upload
                      </p>
                    </div>
                  </label>
                )}
              </div>
            )}
            {profileMode === "goose" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black tracking-tight mb-2">
                    Customize your goose
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                    Create a playful illustrated profile avatar.
                  </p>
                </div>
                <div className="max-w-xl">
                  <AvatarCustomizer
                    value={gooseConfig}
                    onChange={setGooseConfig}
                  />
                </div>
              </div>
            )}
            <div>
              <Button
                type="button"
                className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 disabled:opacity-40 gap-2"
                onClick={async () => {
                  if (profileMode === "goose") {
                    await handleUseGooseProfile();
                  } else if (pendingFile) {
                    try {
                      const { url } =
                        await userApi.uploadProfilePic(pendingFile);
                      const updated = await userApi.updateMe({
                        profile_pic_url: url,
                      });
                      onMeUpdateSuccess(qc, updated);
                      await refetch();
                      setPicPreview(url);
                      setPendingFile(null);
                      notify.success("Profile picture updated");
                    } catch {
                      notify.error("Upload failed");
                    }
                  }
                }}
                disabled={profileMode === "upload" && !pendingFile}
              >
                {profileMode === "goose"
                  ? "Save goose profile"
                  : "Save photo"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Credential */}
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
              borderColor: me.is_verified
                ? "var(--kvis-green-light)"
                : "var(--kvis-rule)",
            }}
          >
            <div
              className="flex items-center justify-between gap-3 px-5 py-2.5 border-b"
              style={{
                borderColor: me.is_verified
                  ? "var(--kvis-green-light)"
                  : "var(--kvis-rule)",
              }}
            >
              <span
                className="text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-1"
                style={{
                  color: me.is_verified
                    ? "var(--kvis-green-light)"
                    : "var(--kvis-text3)",
                }}
              >
                {me.is_verified ? (
                  <>
                    Issued{" "}
                    <Dot className="h-3 w-3 shrink-0" aria-hidden />{" "}
                    Automatic
                  </>
                ) : (
                  "No credential on file"
                )}
              </span>
              <span className="text-xs font-mono tabular-nums tracking-[0.2em] text-[var(--kvis-text3)] flex items-center gap-1">
                KVIS <Dot className="h-3 w-3 shrink-0" aria-hidden /> V01
              </span>
            </div>
            <div className="px-5 py-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 md:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 mb-2">
                  {me.is_verified ? (
                    <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--kvis-green-light)]" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="text-2xl md:text-[1.75rem] font-black tracking-[-0.025em] leading-none text-foreground">
                    KVIS-verified
                  </span>
                </div>
                <p className="text-xs font-mono tracking-wide truncate text-[var(--kvis-text3)]">
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
            <div className="px-5 py-3 border-t border-[var(--kvis-border)]">
              <p className="text-xs text-muted-foreground leading-relaxed truncate">
                {me.is_verified
                  ? "Issued automatically on @kvis.ac.th email confirmation."
                  : "We send a one-time code to your @kvis.ac.th address to issue this credential."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit(saveGeneral)}>
        {/* Identity */}
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
          <FieldRow label="Nickname" hint="Optional display name.">
            <div className="flex items-center gap-3">
              <Input
                {...register("nickname")}
                placeholder="e.g. Tam"
                className={`${inputCls} flex-1`}
              />
              <PrivacyToggle
                value={watchNicknamePublic}
                onChange={(v) =>
                  setValue("nickname_public", v, { shouldDirty: true })
                }
              />
            </div>
          </FieldRow>
          {(isAlumni || isFacultyUser) && (
            <FieldRow label="KVIS cohort">
              <Select
                defaultValue={
                  me.kvis_year ? String(me.kvis_year) : undefined
                }
                onValueChange={(v) =>
                  setValue("kvis_year", parseInt(v), {
                    shouldDirty: true,
                  })
                }
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
          )}
          {/* Teaching period - faculty only */}
          {isFaculty(me) && (
            <>
              <FieldRow label="Department" required>
                <Select
                  defaultValue={me.teach_department ?? undefined}
                  onValueChange={(v) =>
                    setValue("teach_department", v, { shouldDirty: true })
                  }
                >
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {KVIS_DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <SectionHead
                numeral="III."
                kicker="Faculty"
                title="Teaching period"
              />
              <FieldRow
                label="Start year"
                hint="First year you taught at KVIS"
              >
                <Input
                  type="number"
                  {...register("teach_start_year", {
                    valueAsNumber: true,
                  })}
                  className={inputCls}
                  placeholder="e.g. 2018"
                />
              </FieldRow>
              <FieldRow label="Status">
                <div className="flex gap-6 pt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground">
                    <input
                      type="radio"
                      value="true"
                      {...register("is_current_teacher_str")}
                      className="accent-[var(--kvis-purple)]"
                    />
                    Still teaching
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground">
                    <input
                      type="radio"
                      value="false"
                      {...register("is_current_teacher_str")}
                      className="accent-[var(--kvis-purple)]"
                    />
                    Left KVIS
                  </label>
                </div>
              </FieldRow>
              {watch("is_current_teacher_str") === "false" && (
                <FieldRow
                  label="End year"
                  hint="Last year you taught at KVIS"
                >
                  <Input
                    type="number"
                    {...register("teach_end_year", {
                      valueAsNumber: true,
                    })}
                    className={inputCls}
                    placeholder="e.g. 2024"
                  />
                </FieldRow>
              )}
            </>
          )}
          <FieldRow label="Current status">
            <Select
              defaultValue={me.current_status ?? undefined}
              onValueChange={(v) =>
                setValue("current_status", v, { shouldDirty: true })
              }
            >
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="What are you up to?" />
              </SelectTrigger>
              <SelectContent>
                {CURRENT_STATUS_OPTIONS.map((g) => (
                  <SelectGroup key={g.group}>
                    <SelectLabel>{g.group}</SelectLabel>
                    {g.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          {(isStudent ||
            [
              "undergraduate",
              "masters",
              "phd",
              "med_preclinical",
              "med_clinical",
            ].includes(
              watch("current_status") ?? me.current_status ?? "",
            )) && (
            <FieldRow
              label="Expected grad year"
              hint="We'll remind you to update your profile when you graduate."
            >
              <Input
                type="number"
                {...register("expected_grad_year", {
                  valueAsNumber: true,
                })}
                placeholder={`e.g. ${new Date().getFullYear() + 2}`}
                className={inputCls}
              />
            </FieldRow>
          )}
          <FieldRow label="MBTI">
            <Select
              defaultValue={me.mbti ?? undefined}
              onValueChange={(v) =>
                setValue("mbti", v, { shouldDirty: true })
              }
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
              placeholder="Tell your fellow alumni about yourself..."
              {...register("bio")}
              className={`${inputCls} min-h-[100px]`}
            />
          </FieldRow>
          <FieldRow label="Tags" hint="Comma-separated interests.">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Machine Learning, Photography, Hiking"
                {...register("interests")}
                className={`${inputCls} flex-1`}
              />
              <PrivacyToggle
                value={watchInterestsPublic}
                onChange={(v) =>
                  setValue("interests_public", v, { shouldDirty: true })
                }
              />
            </div>
          </FieldRow>
        </section>

        {/* Location */}
        <section>
          <SectionHead
            numeral="IV."
            kicker="Location"
            title="Where you are"
          />
          <FieldRow label="Country">
            <CountrySelect
              variant="underline"
              value={me.country ?? ""}
              onChange={(v) =>
                setValue("country", v, { shouldDirty: true })
              }
            />
          </FieldRow>
          <FieldRow
            label="Province / State"
            hint="Region within your country."
          >
            <Input
              placeholder="e.g. Bangkok, California"
              {...register("place_level2")}
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="City" hint="Optional finer location.">
            <Input
              placeholder="e.g. Bangkok"
              {...register("place")}
              className={inputCls}
            />
          </FieldRow>
        </section>

        {/* Contacts */}
        <section>
          <SectionHead
            numeral="V."
            kicker="Contact"
            title="How to reach you"
          />
          <FieldRow
            label="Public email"
            hint="Shown on your profile if public."
          >
            <div className="flex items-center gap-3">
              <Input
                placeholder="you@gmail.com"
                {...register("contact_email")}
                className={`${inputCls} flex-1`}
              />
              <PrivacyToggle
                value={watchContactEmailPublic}
                onChange={(v) =>
                  setValue("contact_email_public", v, {
                    shouldDirty: true,
                  })
                }
              />
            </div>
          </FieldRow>
          <FieldRow label="LinkedIn">
            <Input
              placeholder="https://linkedin.com/in/..."
              {...register("linkedin_url")}
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="Facebook">
            <Input
              placeholder="https://facebook.com/..."
              {...register("facebook_url")}
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="Instagram">
            <Input
              placeholder="https://instagram.com/..."
              {...register("instagram_url")}
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="Website">
            <Input
              placeholder="https://..."
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

          {/* Extra contacts */}
          <FieldRow
            label="More contacts"
            hint="Up to 3 extra contact methods."
          >
            <div className="space-y-3 md:pt-2.5">
              {extraContacts.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select
                    value={c.type}
                    onValueChange={(v) =>
                      setExtraContacts((prev) =>
                        prev.map((x, j) =>
                          j === i ? { ...x, type: v } : x,
                        ),
                      )
                    }
                  >
                    <SelectTrigger className={`${selectTriggerCls} w-28`}>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={c.value}
                    onChange={(e) =>
                      setExtraContacts((prev) =>
                        prev.map((x, j) =>
                          j === i ? { ...x, value: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="ID or URL"
                    className={`${inputCls} flex-1`}
                  />
                  <PrivacyToggle
                    value={c.public}
                    onChange={(v) =>
                      setExtraContacts((prev) =>
                        prev.map((x, j) =>
                          j === i ? { ...x, public: v } : x,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setExtraContacts((prev) =>
                        prev.filter((_, j) => j !== i),
                      )
                    }
                    className="text-[var(--kvis-text3)] hover:text-foreground transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {extraContacts.length < 3 && (
                <button
                  type="button"
                  onClick={() =>
                    setExtraContacts((prev) => [
                      ...prev,
                      { type: "Email", value: "", public: true },
                    ])
                  }
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--kvis-text3)] hover:text-foreground transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add contact
                </button>
              )}
            </div>
          </FieldRow>
        </section>

        {!isSetup && (
          <div className="pt-8 flex items-center gap-4 flex-wrap">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 disabled:opacity-40 gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save changes
            </Button>
            {!isDirty && !isSubmitting && (
              <span className="text-xs uppercase tracking-[0.22em] text-[var(--kvis-text3)]">
                No unsaved changes
              </span>
            )}
          </div>
        )}
      </form>
    </>
  );
}
