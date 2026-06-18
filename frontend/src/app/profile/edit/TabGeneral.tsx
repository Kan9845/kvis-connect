"use client";
import React from "react";
import type { Area } from "react-easy-crop";
import type { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors, UseFormHandleSubmit } from "react-hook-form";
import type { UserMe } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Loader2,
  Check,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import {
  MBTI_TYPES,
  KVIS_YEARS,
  KVIS_DEPARTMENTS,
} from "@/lib/constants/options";
import {
  CountrySelect,
  ProvinceSelect,
  CitySelect,
  CITY_STATE_COUNTRIES,
} from "@/components/ui/location-selects";
import { useRouter } from "next/navigation";
import { isFaculty } from "@/lib/utils";
import type { AvatarConfig } from "@/lib/avatarTypes";
import type { GeneralForm } from "./schema";
import {
  SectionHead,
  FieldRow,
  PrivacyToggle,
  inputCls,
  textareaCls,
  selectTriggerCls,
} from "./components";
import {
  CURRENT_STATUS_OPTIONS,
  CONTACT_TYPES,
} from "./constants";
import { TabPhoto } from "./TabPhoto";

interface TabGeneralProps {
  me: UserMe;
  refetch: () => Promise<void>;
  isSetup: boolean;
  isStudent: boolean;
  isFacultyUser: boolean;
  isAlumni: boolean;
  notify: { success: (msg: string) => void; error: (msg: string) => void };
  register: UseFormRegister<GeneralForm>;
  watch: UseFormWatch<GeneralForm>;
  setValue: UseFormSetValue<GeneralForm>;
  errors: FieldErrors<GeneralForm>;
  isSubmitting: boolean;
  isDirty: boolean;
  handleSubmit: (fn: (data: GeneralForm) => Promise<void>, onInvalid?: (errors: FieldErrors<GeneralForm>) => void) => (e?: React.BaseSyntheticEvent) => Promise<void>;
  saveGeneral: (data: GeneralForm) => Promise<void>;
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
  watchLinkedinPublic: boolean;
  watchFacebookPublic: boolean;
  watchInstagramPublic: boolean;
  watchWebsitePublic: boolean;
  watchLineIdPublic: boolean;
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
  watchLinkedinPublic,
  watchFacebookPublic,
  watchInstagramPublic,
  watchWebsitePublic,
  watchLineIdPublic,
}: TabGeneralProps) {
  const router = useRouter();

  return (
    <>
      {/* Portrait */}
      <TabPhoto
        me={me}
        refetch={refetch}
        notify={notify}
        cropSrc={cropSrc}
        setCropSrc={setCropSrc}
        crop={crop}
        setCrop={setCrop}
        zoom={zoom}
        setZoom={setZoom}
        croppedAreaPixels={croppedAreaPixels}
        setCroppedAreaPixels={setCroppedAreaPixels}
        picPreview={picPreview}
        setPicPreview={setPicPreview}
        pendingFile={pendingFile}
        setPendingFile={setPendingFile}
        profileMode={profileMode}
        setProfileMode={setProfileMode}
        gooseConfig={gooseConfig}
        setGooseConfig={setGooseConfig}
        avatarRef={avatarRef}
        getCroppedFile={getCroppedFile}
        handleUseGooseProfile={handleUseGooseProfile}
        handlePicChange={handlePicChange}
      />

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

      <form onSubmit={handleSubmit(saveGeneral, (errs) => { const msg = Object.values(errs).find(e => e?.message)?.message; toast.error(msg ?? "Please fill in all required fields"); })}>
        {/* Identity */}
        <section>
          <SectionHead
            numeral="III."
            kicker="Identity"
            title="The basics"
          />
          <FieldRow label="First name" required error={errors.first_name?.message}>
            <Input {...register("first_name")} className={inputCls} />
          </FieldRow>
          <FieldRow label="Last name" required error={errors.last_name?.message}>
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
          {isAlumni && (
            <FieldRow label="KVIS cohort" required>
              <Select
                defaultValue={me.kvis_year ? String(me.kvis_year) : undefined}
                onValueChange={(v) =>
                  setValue("kvis_year", parseInt(v), { shouldDirty: true })
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
              <FieldRow label="Start year" hint="First year you taught at KVIS">
                <Input
                  type="number"
                  {...register("teach_start_year", { valueAsNumber: true })}
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
                <FieldRow label="End year" hint="Last year you taught at KVIS">
                  <Input
                    type="number"
                    {...register("teach_end_year", { valueAsNumber: true })}
                    className={inputCls}
                    placeholder="e.g. 2024"
                  />
                </FieldRow>
              )}
            </>
          )}
          <FieldRow label="Current status" required>
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
                {CURRENT_STATUS_OPTIONS.map((g, index) => (
                  <React.Fragment key={g.group}>
                    {index > 0 && <SelectSeparator />}
                    <SelectGroup>
                      <SelectLabel>{g.group}</SelectLabel>
                      {g.options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          {(isStudent ||
            ["undergraduate", "masters", "phd", "med_preclinical", "med_clinical"].includes(
              watch("current_status") ?? me.current_status ?? "",
            )) && (
            <FieldRow
              label="Expected grad year"
              hint="We'll remind you to update your profile when you graduate."
            >
              <Input
                type="number"
                {...register("expected_grad_year", { valueAsNumber: true })}
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
              className={`${textareaCls} min-h-[100px]`}
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
          <SectionHead numeral="IV." kicker="Location" title="Where you are" />
          <FieldRow label="Country" required error={errors.country?.message}>
            <CountrySelect
              variant="underline"
              value={watch("country") ?? ""}
              onChange={(v) => setValue("country", v, { shouldDirty: true })}
            />
          </FieldRow>
          {watch("country") && !CITY_STATE_COUNTRIES.has(watch("country")!) && (
            <FieldRow label="Province / State" hint="Region within your country.">
              <ProvinceSelect
                variant="underline"
                country={watch("country") ?? ""}
                value={watch("place_level2") ?? ""}
                onChange={(v) =>
                  setValue("place_level2", v, { shouldDirty: true })
                }
              />
            </FieldRow>
          )}
          {watch("country") && !CITY_STATE_COUNTRIES.has(watch("country")!) && (
            <FieldRow label="City" hint="Optional finer location.">
              <CitySelect
                variant="underline"
                country={watch("country") ?? ""}
                province={watch("place_level2") ?? ""}
                value={watch("place") ?? ""}
                onChange={(v) => setValue("place", v, { shouldDirty: true })}
              />
            </FieldRow>
          )}
        </section>

        {/* Contacts */}
        <section>
          <SectionHead numeral="V." kicker="Contact" title="How to reach you" />
          <FieldRow label="Public email" hint="Shown on your profile if public.">
            <div className="flex items-center gap-3">
              <Input
                placeholder="you@gmail.com"
                {...register("contact_email")}
                className={`${inputCls} flex-1`}
              />
              <PrivacyToggle
                value={watchContactEmailPublic}
                onChange={(v) =>
                  setValue("contact_email_public", v, { shouldDirty: true })
                }
              />
            </div>
          </FieldRow>
          <FieldRow label="LinkedIn">
            <div className="flex items-center gap-3">
              <Input placeholder="https://linkedin.com/in/..." {...register("linkedin_url")} className={`${inputCls} flex-1`} />
              <PrivacyToggle value={watchLinkedinPublic} onChange={(v) => setValue("linkedin_public", v, { shouldDirty: true })} />
            </div>
          </FieldRow>
          <FieldRow label="Facebook">
            <div className="flex items-center gap-3">
              <Input placeholder="https://facebook.com/..." {...register("facebook_url")} className={`${inputCls} flex-1`} />
              <PrivacyToggle value={watchFacebookPublic} onChange={(v) => setValue("facebook_public", v, { shouldDirty: true })} />
            </div>
          </FieldRow>
          <FieldRow label="Instagram">
            <div className="flex items-center gap-3">
              <Input placeholder="https://instagram.com/..." {...register("instagram_url")} className={`${inputCls} flex-1`} />
              <PrivacyToggle value={watchInstagramPublic} onChange={(v) => setValue("instagram_public", v, { shouldDirty: true })} />
            </div>
          </FieldRow>
          <FieldRow label="Website">
            <div className="flex items-center gap-3">
              <Input placeholder="https://..." {...register("website_url")} className={`${inputCls} flex-1`} />
              <PrivacyToggle value={watchWebsitePublic} onChange={(v) => setValue("website_public", v, { shouldDirty: true })} />
            </div>
          </FieldRow>
          <FieldRow label="LINE ID">
            <div className="flex items-center gap-3">
              <Input placeholder="your.line.id" {...register("line_id")} className={`${inputCls} flex-1`} />
              <PrivacyToggle value={watchLineIdPublic} onChange={(v) => setValue("line_id_public", v, { shouldDirty: true })} />
            </div>
          </FieldRow>
          <FieldRow label="More contacts" hint="Up to 3 extra contact methods.">
            <div className="space-y-3 md:pt-2.5">
              {extraContacts.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select
                    value={c.type}
                    onValueChange={(v) =>
                      setExtraContacts((prev) =>
                        prev.map((x, j) => (j === i ? { ...x, type: v } : x)),
                      )
                    }
                  >
                    <SelectTrigger className={`${selectTriggerCls} w-28`}>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
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
                        prev.map((x, j) => (j === i ? { ...x, public: v } : x)),
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setExtraContacts((prev) => prev.filter((_, j) => j !== i))
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