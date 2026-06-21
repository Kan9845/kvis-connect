"use client";
import type { Area } from "react-easy-crop";
import { useEffect, useRef, useState } from "react";
import { useForm, type UseFormHandleSubmit } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userApi, authApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { onMeUpdateSuccess } from "@/lib/cache/invalidate";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Check,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Dot,
  ExternalLink,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Education, Career } from "@/lib/types";
import { defaultAvatar } from "@/components/avatar/avatarData";
import { AvatarConfig } from "@/lib/avatarTypes";
import { cohortColorHex, cohortColorSoftHex } from "@/lib/utils";
import { isFaculty } from "@/lib/utils";
import { generalSchema, type GeneralForm, type Tab } from "./schema";
import { TabGeneral } from "./TabGeneral";
import { TabEducation } from "./TabEducation";
import { TabCareer } from "./TabCareer";
import { TabResearch } from "./TabResearch";
import { TabPersonal } from "./TabPersonal";
import { MED_DEGREES } from "./constants";
import { TabAccount } from "./TabAccount";
import { TabExperience } from "./TabExperience";
import type { Competition, ExperienceCamp, ClubLeadership } from "@/lib/types";

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function EditPageInner() {
  const searchParams = useSearchParams();
  const isSetup = searchParams.has("setup");
  const [googleStatus, setGoogleStatus] = useState<"linked" | "error_taken" | "error_cancelled" | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => {
    const g = searchParams.get("google");
    const err = searchParams.get("error");
    if (g === "linked") setGoogleStatus("linked");
    if (err === "google_taken") setGoogleStatus("error_taken");
    if (err === "google_cancelled") setGoogleStatus("error_cancelled");
  }, [searchParams]);

  async function handleUnlinkGoogle() {
    setUnlinking(true);
    try {
      await authApi.unlinkGoogle();
      await refetch();
      setGoogleStatus(null);
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? "Failed to unlink.");
    } finally {
      setUnlinking(false);
    }
  }

  const notify = {
    success: (msg: string) => {
      if (!isSetup) toast.success(msg);
    },
    error: (msg: string) => {
      if (!isSetup) toast.error(msg);
    },
  };
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const router = useRouter();
  const { user: me, loading, refetch } = useAuth();
  const qc = useQueryClient();
  const [picPreview, setPicPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [tab, setTab] = useState<Tab>("general");
  const [tabMenuOpen, setTabMenuOpen] = useState(false);
  const isGooseProfile = !!me?.goose_config;
  const [gooseConfig, setGooseConfig] = useState<AvatarConfig>(() => {
    if (me?.goose_config) {
      try { return JSON.parse(me.goose_config); } catch { /* fall through */ }
    }
    return defaultAvatar;
  });
  const avatarRef = useRef<HTMLDivElement>(null);
  const [profileMode, setProfileMode] = useState<"upload" | "goose">(isGooseProfile ? "goose" : "upload");

  // Extra contacts state
  const [extraContacts, setExtraContacts] = useState<
    { type: string; value: string; public: boolean }[]
  >([]);

  // Research state
  const [researchInterests, setResearchInterests] = useState<string[]>([]);
  const [projects, setProjects] = useState<
    {
      title: string;
      advisor?: string;
      advisor2?: string;
      description?: string;
      status: string;
      link?: string;
    }[]
  >([]);
  const [publications, setPublications] = useState<
    { citation: string; doi?: string }[]
  >([]);
  const [portfolioLinks, setPortfolioLinks] = useState<
    { type: string; url: string }[]
  >([]);
  const [launches, setLaunches] = useState<
    {
      name: string;
      innovation_type: string;
      innovation_type_other?: string;
      role: string;
      status?: string;
      description?: string;
      link?: string;
    }[]
  >([]);

  // Personal state
  const [languages, setLanguages] = useState<
    { lang: string; proficiency?: string }[]
  >([]);
  const [hobbies, setHobbies] = useState<Record<string, string[]>>({});
  const [kvisFavMenu, setKvisFavMenu] = useState("");
  const [kvisFavEvent, setKvisFavEvent] = useState("");
  const [kvisFavArea, setKvisFavArea] = useState("");
  // Experience state
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [camps, setCamps] = useState<ExperienceCamp[]>([]);
  const [clubs, setClubs] = useState<ClubLeadership[]>([]);

  useEffect(() => {
    if (!loading && !me) router.push("/auth/login");
  }, [loading, me, router]);

  useEffect(() => {
    if (me) {
      setExtraContacts((me.extra_contacts as { type: string; value: string; public: boolean }[]) ?? []);
      setResearchInterests(me.research_interests ?? []);
      setProjects(me.projects ?? []);
      setPublications(me.publications ?? []);
      setPortfolioLinks(me.portfolio_links ?? []);
      setLaunches((me as any).launches ?? []);
      setLanguages(me.languages ?? []);
      setHobbies(me.hobbies ?? {});
      setKvisFavMenu(me.kvis_fav_menu ?? "");
      setKvisFavEvent(me.kvis_fav_event ?? "");
      setKvisFavArea(me.kvis_fav_area ?? "");
      setCompetitions((me.competitions as Competition[]) ?? []);
      setCamps((me.experience_camps as ExperienceCamp[]) ?? []);
      setClubs((me.clubs as ClubLeadership[]) ?? []);
    }
  }, [me]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<GeneralForm>({
    resolver: zodResolver(generalSchema),
    resetOptions: { keepDirtyValues: true },
    values: me
      ? {
          first_name: me.first_name,
          last_name: me.last_name,
          kvis_year: me.kvis_year ?? 0,
          expected_grad_year: me.expected_grad_year ?? undefined,
          teach_department: me.teach_department ?? "",
          place: me.place ?? "",
          country: me.country ?? "",
          bio: me.bio ?? "",
          mbti: me.mbti ?? "",
          interests: me.interests ?? "",
          facebook_url: me.facebook_url ?? "",
          instagram_url: me.instagram_url ?? "",
          linkedin_url: me.linkedin_url ?? "",
          line_id: me.line_id ?? "",
          website_url: me.website_url ?? "",
          teach_start_year: me.teach_start_year ?? undefined,
          teach_end_year: me.teach_end_year ?? undefined,
          is_current_teacher_str: me.is_current_teacher ? "true" : "false",
          nickname: me.nickname ?? "",
          nickname_public: me.nickname_public ?? true,
          current_status: me.current_status ?? "",
          province_of_origin: me.province_of_origin ?? "",
          place_level2: me.place_level2 ?? "",
          contact_email: me.contact_email ?? "",
          contact_email_public: me.contact_email_public ?? true,
          linkedin_public: me.linkedin_public ?? true,
          facebook_public: me.facebook_public ?? true,
          instagram_public: me.instagram_public ?? true,
          website_public: me.website_public ?? true,
          line_id_public: me.line_id_public ?? true,
          interests_public: me.interests_public ?? true,
        } as GeneralForm : undefined,
  });

  const watchNicknamePublic = watch("nickname_public") ?? true;
  const watchInterestsPublic = watch("interests_public") ?? true;
  const watchContactEmailPublic = watch("contact_email_public") ?? true;
  const watchLinkedinPublic = watch("linkedin_public") ?? true;
  const watchFacebookPublic = watch("facebook_public") ?? true;
  const watchInstagramPublic = watch("instagram_public") ?? true;
  const watchWebsitePublic = watch("website_public") ?? true;
  const watchLineIdPublic = watch("line_id_public") ?? true;

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
      } catch {
        notify.error("Photo upload failed");
        return;
      }
    }
    try {
      const updated = await userApi.updateMe({
        ...(picUrl ? { ...data, profile_pic_url: picUrl } : data),
        is_current_teacher: data.is_current_teacher_str === "true",
      });
      await userApi.updateExtraContacts(
        extraContacts.map((c) => ({ type: c.type, value: c.value, is_public: c.public }))
      );
      onMeUpdateSuccess(qc, updated);
      await refetch();
      notify.success("Profile updated");
    } catch {
      notify.error("Failed to save profile");
    }
  };

  const saveEducation = async () => {
    for (const edu of education) {
      if (!edu.uni_name?.trim() || !edu.degree?.trim()) {
        notify.error("Please fill in University and Degree for all entries.");
        throw new Error("Validation failed");
      }
      if (!MED_DEGREES.includes(edu.degree) && !edu.major?.trim()) {
        notify.error("Please fill in the Major for all entries.");
        throw new Error("Validation failed");
      }
      if (MED_DEGREES.includes(edu.degree) && !edu.med_school?.trim()) {
        notify.error("Please select a Medical school for all entries.");
        throw new Error("Validation failed");
      }
    }
    try {
      await userApi.updateEducation(education);
      await refetch();
      notify.success("Education saved");
    } catch {
      notify.error("Failed to save education");
    }
  };

  const saveCareer = async () => {
    for (const job of career) {
      if (!job.job_title?.trim() || !job.industry_sector?.trim() || !job.role_type?.trim()) {
        notify.error("Please fill in Job title, Industry, and Role type for all entries.");
        throw new Error("Validation failed");
      }
    }
    try {
      await userApi.updateCareer(career);
      await refetch();
      notify.success("Career saved");
    } catch {
      notify.error("Failed to save career");
    }
  };

  const saveResearch = async () => {
    try {
      await Promise.all([
        userApi.updateResearchInterests(researchInterests),
        userApi.updateProjects(projects),
        userApi.updatePublications(publications),
        userApi.updatePortfolioLinks(portfolioLinks),
        userApi.updateLaunches(launches),
      ]);
      await refetch();
      notify.success("Research saved");
    } catch {
      notify.error("Failed to save");
    }
  };

  const saveExperience = async () => {
    try {
      await userApi.updateMe({
        competitions,
        experience_camps: camps,
        clubs,
      } as any);
      await refetch();
      notify.success("Experience saved");
    } catch {
      notify.error("Failed to save experience");
    }
  };

  const savePersonal = async () => {
    try {
      await Promise.all([
        userApi.updateMe({
          hobbies,
          kvis_fav_menu: kvisFavMenu,
          kvis_fav_event: kvisFavEvent,
          kvis_fav_area: kvisFavArea,
        }),
        userApi.updateLanguages(languages),
      ]);
      await refetch();
      notify.success("Personal info saved");
    } catch {
      notify.error("Failed to save");
    }
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
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
        );
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject("Blob failed");
            resolve(new File([blob], "profile.jpg", { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.92,
        );
      };
    });
  };

  const handleUseGooseProfile = async () => {
    if (!me) return;
    try {
      const updated = await userApi.updateMe({
        goose_config: JSON.stringify(gooseConfig),
        profile_pic_url: null as any,
      });
      onMeUpdateSuccess(qc, updated);
      await refetch();
      notify.success("Goose profile updated");
    } catch {
      notify.error("Failed to save goose profile");
    }
  };

  if (loading || !me) {
    return (
      <div className="min-h-full bg-background">
        <div
          className={`mx-auto max-w-5xl px-4 md:px-6 py-xl lg:py-layout ${isSetup ? "pb-32" : ""}`}
        >
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

  const isStudent = !!me.current_grade;
  const isFacultyUser = isFaculty(me);
  const isAlumni = !isStudent && !isFacultyUser;

  const tabList = (
    isStudent
      ? ["general", "experience", "research", "personal", "account"]
      : ["general", "education", "career", "experience", "research", "personal", "account"]
  ).filter((t) => !(isSetup && t === "account"));
  const activeIdx = tabList.indexOf(tab);

  return (
    <div className="min-h-full bg-background">
      <div
        className={`mx-auto max-w-5xl px-4 md:px-6 py-xl lg:py-layout ${isSetup ? "pb-28 sm:pb-44 lg:pb-44" : ""}`}
      >
        <header className="pb-7 border-b border-[var(--sep-strong)]">
          <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 text-[var(--kvis-green-light)] flex items-center gap-1">
            {isSetup ? (
              <>
                KVIS Connect <Dot className="h-3 w-3 shrink-0" aria-hidden />{" "}
                Welcome
              </>
            ) : (
              <>
                KVIS Connect <Dot className="h-3 w-3 shrink-0" aria-hidden />{" "}
                Edit Dossier
              </>
            )}
          </p>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95] text-foreground">
            {isSetup ? "Set up your profile." : "Edit profile"}
          </h1>
          <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-[80ch] leading-relaxed">
            {isSetup
              ? "Fill in as much or as little as you like across the tabs below - you can always update everything later."
              : "Update your dossier - the page other Kvisians see when they look you up."}
          </p>
          <div className="flex items-center gap-3 md:gap-4 mt-6 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap text-[var(--kvis-text3)]">
            <Link
              href={`/profile/${me.slug}`}
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors underline decoration-1 underline-offset-4"
            >
              View public profile
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
            </Link>
          </div>
        </header>

        {/* Desktop: horizontal section rail */}
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as Tab)}
          className="hidden w-full md:block"
        >
          <TabsList className="h-auto w-full justify-start gap-7 rounded-none bg-transparent p-0 pt-5 pb-0 border-b border-[var(--sep-strong)] overflow-x-auto">
            {tabList.map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="rounded-none bg-transparent px-0 py-2 text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground shadow-none transition-colors hover:text-foreground border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:text-[var(--kvis-purple)] data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-[var(--kvis-purple)] whitespace-nowrap"
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Mobile: dossier section selector */}
        <div className="md:hidden sticky top-0 z-30 bg-background pt-4 border-b border-[var(--sep-strong)]">
          <button
            type="button"
            onClick={() => setTabMenuOpen((o) => !o)}
            aria-expanded={tabMenuOpen}
            aria-label="Choose section"
            className="w-full flex items-center justify-between gap-3 pb-4 text-left"
          >
            <span className="flex items-baseline gap-3 min-w-0">
              <span className="font-mono text-sm tabular-nums text-[var(--kvis-purple-light)] shrink-0">
                {String(activeIdx + 1).padStart(2, "0")}
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--kvis-purple-light)] truncate">
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${tabMenuOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${tabMenuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <div className="pb-2">
                {tabList.map((t, i) => {
                  const active = t === tab;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTab(t as Tab);
                        setTabMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 py-3 text-left border-t border-[var(--kvis-border)] transition-colors ${active ? "" : "active:bg-foreground/[0.04]"}`}
                    >
                      <span
                        className={`font-mono text-sm tabular-nums shrink-0 ${active ? "text-[var(--kvis-purple-light)]" : "text-[var(--kvis-text3)]"}`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`text-xs font-bold uppercase tracking-[0.28em] ${active ? "text-[var(--kvis-purple-light)]" : "text-muted-foreground"}`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </span>
                      {active && (
                        <Check className="h-3.5 w-3.5 ml-auto text-[var(--kvis-purple-light)] shrink-0" aria-hidden />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── GENERAL TAB ─────────────────────────────────────────────────── */}
        {tab === "general" && (
          <TabGeneral
            me={me}
            refetch={refetch}
            isSetup={isSetup}
            isStudent={isStudent}
            isFacultyUser={isFacultyUser}
            isAlumni={isAlumni}
            notify={notify}
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
            isSubmitting={isSubmitting}
            isDirty={isDirty || JSON.stringify(extraContacts) !== JSON.stringify((me.extra_contacts as { type: string; value: string; public: boolean }[]) ?? [])}
            handleSubmit={handleSubmit}
            saveGeneral={saveGeneral}
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
            extraContacts={extraContacts}
            setExtraContacts={setExtraContacts}
            watchNicknamePublic={watchNicknamePublic}
            watchInterestsPublic={watchInterestsPublic}
            watchContactEmailPublic={watchContactEmailPublic}
            watchLinkedinPublic={watchLinkedinPublic}
            watchFacebookPublic={watchFacebookPublic}
            watchInstagramPublic={watchInstagramPublic}
            watchWebsitePublic={watchWebsitePublic}
            watchLineIdPublic={watchLineIdPublic}
          />
        )}

        {/* ── EDUCATION TAB ────────────────────────────────────────────────── */}
        {tab === "education" && !isStudent && (
          <TabEducation
            isSetup={isSetup}
            isDirty={JSON.stringify(education) !== JSON.stringify(me.education.map(({ id: _id, ...rest }) => rest))}
            education={education}
            setEducation={setEducation}
            saveEducation={saveEducation}
          />
        )}

        {/* ── CAREER TAB ───────────────────────────────────────────────────── */}
        {tab === "career" && !isStudent && (
          <TabCareer
            isSetup={isSetup}
            isDirty={JSON.stringify(career) !== JSON.stringify(me.career.map(({ id: _id, ...rest }) => rest))}
            career={career}
            setCareer={setCareer}
            saveCareer={saveCareer}
          />
        )}

        {/* ── RESEARCH TAB ─────────────────────────────────────────────────── */}
        {tab === "research" && (
          <TabResearch
            isSetup={isSetup}
            isStudent={isStudent}
            isDirty={
              JSON.stringify(researchInterests) !== JSON.stringify(me.research_interests ?? []) ||
              JSON.stringify(projects) !== JSON.stringify(me.projects ?? []) ||
              JSON.stringify(publications) !== JSON.stringify(me.publications ?? []) ||
              JSON.stringify(portfolioLinks) !== JSON.stringify(me.portfolio_links ?? []) ||
              JSON.stringify(launches) !== JSON.stringify((me as any).launches ?? [])
            }
            researchInterests={researchInterests}
            setResearchInterests={setResearchInterests}
            projects={projects}
            setProjects={setProjects}
            publications={publications}
            setPublications={setPublications}
            portfolioLinks={portfolioLinks}
            setPortfolioLinks={setPortfolioLinks}
            launches={launches}
            setLaunches={setLaunches}
            saveResearch={saveResearch}
          />
        )}

        {/* ── EXPERIENCE TAB ───────────────────────────────────────────────── */}
        {tab === "experience" && (
          <TabExperience
            isSetup={isSetup}
            isDirty={
              JSON.stringify(competitions) !== JSON.stringify((me.competitions as Competition[]) ?? []) ||
              JSON.stringify(camps) !== JSON.stringify((me.experience_camps as ExperienceCamp[]) ?? []) ||
              JSON.stringify(clubs) !== JSON.stringify((me.clubs as ClubLeadership[]) ?? [])
            }
            competitions={competitions}
            setCompetitions={setCompetitions}
            camps={camps}
            setCamps={setCamps}
            clubs={clubs}
            setClubs={setClubs}
            saveExperience={saveExperience}
          />
        )}

        {/* ── PERSONAL TAB ─────────────────────────────────────────────────── */}
        {tab === "personal" && (
          <TabPersonal
            isSetup={isSetup}
            isDirty={
              JSON.stringify(languages) !== JSON.stringify(me.languages ?? []) ||
              JSON.stringify(hobbies) !== JSON.stringify(me.hobbies ?? {}) ||
              kvisFavMenu !== (me.kvis_fav_menu ?? "") ||
              kvisFavEvent !== (me.kvis_fav_event ?? "") ||
              kvisFavArea !== (me.kvis_fav_area ?? "")
            }
            me={me}
            refetch={refetch}
            languages={languages}
            setLanguages={setLanguages}
            hobbies={hobbies}
            setHobbies={setHobbies}
            kvisFavMenu={kvisFavMenu}
            setKvisFavMenu={setKvisFavMenu}
            kvisFavEvent={kvisFavEvent}
            setKvisFavEvent={setKvisFavEvent}
            kvisFavArea={kvisFavArea}
            setKvisFavArea={setKvisFavArea}
            savePersonal={savePersonal}
          />
        )}

        {tab === "account" && (
          <TabAccount
            me={me}
            refetch={refetch}
            googleStatus={googleStatus}
            unlinking={unlinking}
            handleUnlinkGoogle={handleUnlinkGoogle}
          />
        )}
      </div>
      {isSetup && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-[var(--kvis-border)]">
          {(() => {
            const tabs = isStudent
              ? ["general", "experience", "research", "personal"]
              : ["general", "education", "career", "experience", "research", "personal"];
            const idx = tabs.indexOf(tab);
            const isLast = idx === tabs.length - 1;

            const handleSave = async () => {
              try {
                if (tab === "general") {
                  return await new Promise<boolean>((resolve) => {
                    handleSubmit(
                      async (data) => {
                        await saveGeneral(data);
                        resolve(true);
                      },
                      (errs) => {
                        if (!isSetup) {
                          const msg = Object.values(errs).find(e => e?.message)?.message;
                          toast.error(msg ?? "Please fill in all required fields");
                        }
                        resolve(false);
                      },
                    )();
                  });
                }
                else if (tab === "education") await saveEducation();
                else if (tab === "career") await saveCareer();
                else if (tab === "research") await saveResearch();
                else if (tab === "experience") await saveExperience();
                else if (tab === "personal") await savePersonal();
                return true;
              } catch {
                return false;
              }
            };

            return (
              <>
                {/* Progress strip - full width, visible on all sizes */}
                <div className="flex">
                  {tabs.map((t, j) => (
                    <div
                      key={t}
                      className="h-[3px] flex-1 transition-colors duration-300"
                      style={{
                        background: j <= idx ? "var(--kvis-purple)" : "var(--kvis-rule)",
                      }}
                    />
                  ))}
                </div>

                {/* Main row */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
                  {/* Step label */}
                  <div className="flex items-center gap-4 min-w-0">
                    <span
                      className="font-mono font-black text-3xl sm:text-4xl tabular-nums leading-none shrink-0"
                      style={{ color: "var(--kvis-green-light)", letterSpacing: "-0.04em" }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] truncate"
                        style={{ color: "var(--kvis-text3)" }}>
                        Step {idx + 1} of {tabs.length}
                      </p>
                      <p className="text-xs sm:text-sm font-semibold truncate text-foreground">
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => setTab(tabs[idx - 1] as Tab)}
                        className="flex items-center gap-1 px-3 sm:px-5 py-2.5 sm:py-3 text-xs font-bold uppercase tracking-[0.24em] border border-[var(--kvis-border)] bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors"
                      >
                        <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="hidden xs:inline">Back</span>
                      </button>
                    )}
                    {isLast ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const saved = await handleSave();
                          if (!saved) return;
                          if (!watch("country")) {
                            setError("country", { message: "Country is required to place your pin on the globe." });
                            setTab("general");
                            setTimeout(() => {
                              document.getElementById("location-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }, 100);
                            return;
                          }
                          try {
                            await userApi.updateMe({ profile_setup_done: true });
                            await refetch();
                            router.push("/kvisian");
                          } catch {
                            notify.error("Something went wrong, try again.");
                          }
                        }}
                        className="flex items-center gap-1.5 px-4 sm:px-8 py-2.5 sm:py-3 text-xs font-bold uppercase tracking-[0.24em] bg-foreground text-background hover:bg-foreground/90 transition-opacity"
                      >
                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="sm:hidden">Done</span>
                        <span className="hidden sm:inline">Done - take me in</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          const saved = await handleSave();
                          if (!saved) return;
                          setTab(tabs[idx + 1] as Tab);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="flex items-center gap-1.5 px-4 sm:px-8 py-2.5 sm:py-3 text-xs font-bold uppercase tracking-[0.24em] bg-foreground text-background hover:bg-foreground/90 transition-opacity"
                      >
                        <span className="sm:hidden">Next</span>
                        <span className="hidden sm:inline">
                          {tabs[idx + 1].charAt(0).toUpperCase() + tabs[idx + 1].slice(1)}
                        </span>
                        <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
