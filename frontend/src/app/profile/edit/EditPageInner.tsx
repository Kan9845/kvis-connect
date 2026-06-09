"use client";
import type { Area } from "react-easy-crop";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userApi } from "@/lib/api";
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
  Dot,
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function EditPageInner() {
  const searchParams = useSearchParams();
  const isSetup = searchParams.has("setup");
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
  const [gooseConfig, setGooseConfig] = useState<AvatarConfig>(defaultAvatar);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [profileMode, setProfileMode] = useState<"upload" | "goose">("upload");

  // Extra contacts state
  const [extraContacts, setExtraContacts] = useState<
    { type: string; value: string; public: boolean }[]
  >([]);

  // Research state
  const [researchInterests, setResearchInterests] = useState<string[]>([]);
  const [researchKeywords, setResearchKeywords] = useState("");
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

  // Personal state
  const [languages, setLanguages] = useState<
    { lang: string; proficiency?: string }[]
  >([]);
  const [hobbies, setHobbies] = useState<Record<string, string[]>>({});
  const [kvisFavMenu, setKvisFavMenu] = useState("");
  const [kvisFavEvent, setKvisFavEvent] = useState("");
  const [kvisFavArea, setKvisFavArea] = useState("");

  useEffect(() => {
    if (!loading && !me) router.push("/auth/login");
  }, [loading, me, router]);

  useEffect(() => {
    if (me) {
      setExtraContacts((me.extra_contacts as { type: string; value: string; public: boolean }[]) ?? []);
      setResearchInterests(me.research_interests ?? []);
      setResearchKeywords(me.research_keywords ?? "");
      setProjects(me.projects ?? []);
      setPublications(me.publications ?? []);
      setPortfolioLinks(me.portfolio_links ?? []);
      setLanguages(me.languages ?? []);
      setHobbies(me.hobbies ?? {});
      setKvisFavMenu(me.kvis_fav_menu ?? "");
      setKvisFavEvent(me.kvis_fav_event ?? "");
      setKvisFavArea(me.kvis_fav_area ?? "");
    }
  }, [me]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<GeneralForm>({
    resolver: zodResolver(generalSchema),
    values: me
      ? {
          first_name: me.first_name,
          last_name: me.last_name,
          kvis_year: me.kvis_year ?? undefined,
          expected_grad_year: me.expected_grad_year ?? undefined,
          teach_department: me.teach_department ?? "",
          place: me.place ?? "",
          country: me.country ?? "",
          bio: me.bio ?? "",
          mbti: me.mbti ?? "",
          interests: me.interests ?? "",
          facebook_url: me.facebook_url ?? "",
          linkedin_url: me.linkedin_url ?? "",
          line_id: me.line_id ?? "",
          website_url: me.website_url ?? "",
          teach_start_year: me.teach_start_year ?? undefined,
          teach_end_year: me.teach_end_year ?? undefined,
          is_current_teacher_str: me.is_current_teacher ? "true" : "false",
          nickname: me.nickname ?? "",
          nickname_public: me.nickname_public ?? true,
          current_status: me.current_status ?? "",
          place_level2: me.place_level2 ?? "",
          contact_email: me.contact_email ?? "",
          contact_email_public: me.contact_email_public ?? true,
          instagram_url: me.instagram_url ?? "",
          interests_public: me.interests_public ?? true,
        }
      : undefined,
  });

  const watchNicknamePublic = watch("nickname_public") ?? true;
  const watchInterestsPublic = watch("interests_public") ?? true;
  const watchContactEmailPublic = watch("contact_email_public") ?? true;

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
  };

  const saveEducation = async () => {
    await userApi.updateEducation(education);
    await refetch();
    notify.success("Education saved");
  };

  const saveCareer = async () => {
    await userApi.updateCareer(career);
    await refetch();
    notify.success("Career saved");
  };

  const saveResearch = async () => {
    try {
      await Promise.all([
        userApi.updateMe({ research_keywords: researchKeywords }),
        userApi.updateResearchInterests(researchInterests),
        userApi.updateProjects(projects),
        userApi.updatePublications(publications),
        userApi.updatePortfolioLinks(portfolioLinks),
      ]);
      await refetch();
      notify.success("Research saved");
    } catch {
      notify.error("Failed to save");
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
      const size = 600;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, cohortColorHex(me.kvis_year));
      grad.addColorStop(1, cohortColorSoftHex(me.kvis_year));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      const drawLayer = (src: string, scale = 1.26) =>
        new Promise<void>((res, rej) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const off = (size * (scale - 1)) / 2;
            ctx.drawImage(img, -off, -off, size * scale, size * scale);
            res();
          };
          img.onerror = (e) => {
            console.warn("Failed to load", src, e);
            res();
          };
          img.src = src;
        });
      const layerOrder = [
        "eyes",
        "brows",
        "hair",
        "head",
        "glasses",
        "cheek",
        "neck",
        "hand",
      ] as const;
      await drawLayer("/goose/goose_base.png");
      for (const layer of layerOrder) {
        const asset = gooseConfig[layer];
        if (asset) await drawLayer(`/goose/${asset}.png`);
      }
      await drawLayer("/goose/layout.png");
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "goose-profile.png", {
          type: "image/png",
        });
        const { url } = await userApi.uploadProfilePic(file);
        const updated = await userApi.updateMe({ profile_pic_url: url });
        onMeUpdateSuccess(qc, updated);
        await refetch();
        setPicPreview(url);
        notify.success("Goose profile updated");
      }, "image/png");
    } catch (err: any) {
      notify.error("Failed to generate goose profile");
    }
  };

  if (loading || !me) {
    return (
      <div className="min-h-full bg-background">
        <div
          className={`mx-auto max-w-5xl px-6 lg:px-10 py-xl lg:py-layout ${isSetup ? "pb-32" : ""}`}
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

  return (
    <div className="min-h-full bg-background">
      <div
        className={`mx-auto max-w-5xl px-6 lg:px-10 py-xl lg:py-layout ${isSetup ? "pb-32" : ""}`}
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
            <span>{me.email}</span>
            <Dot className="h-3 w-3 shrink-0" aria-hidden />
            <Link
              href={`/profile/${me.slug}`}
              className="hover:text-foreground transition-colors underline decoration-1 underline-offset-4"
            >
              View public profile
            </Link>
          </div>
        </header>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as Tab)}
          className="w-full"
        >
          <TabsList className="h-auto w-full justify-start gap-7 rounded-none bg-transparent p-0 pt-5 pb-0 border-b border-[var(--sep-strong)] overflow-x-auto">
            {(isStudent
              ? ["general", "research", "personal"]
              : ["general", "education", "career", "research", "personal"]
            ).map((t) => (
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
            isDirty={isDirty}
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
          />
        )}

        {/* ── EDUCATION TAB ────────────────────────────────────────────────── */}
        {tab === "education" && !isStudent && (
          <TabEducation
            isSetup={isSetup}
            education={education}
            setEducation={setEducation}
            saveEducation={saveEducation}
          />
        )}

        {/* ── CAREER TAB ───────────────────────────────────────────────────── */}
        {tab === "career" && !isStudent && (
          <TabCareer
            isSetup={isSetup}
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
            researchInterests={researchInterests}
            setResearchInterests={setResearchInterests}
            researchKeywords={researchKeywords}
            setResearchKeywords={setResearchKeywords}
            projects={projects}
            setProjects={setProjects}
            publications={publications}
            setPublications={setPublications}
            portfolioLinks={portfolioLinks}
            setPortfolioLinks={setPortfolioLinks}
            saveResearch={saveResearch}
          />
        )}

        {/* ── PERSONAL TAB ─────────────────────────────────────────────────── */}
        {tab === "personal" && (
          <TabPersonal
            isSetup={isSetup}
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
      </div>
      {isSetup && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--kvis-border)] bg-background/95 backdrop-blur px-6 py-4 flex items-center justify-between gap-4">
          {/* Step indicator */}
          {(() => {
            const tabs = isStudent
              ? ["general", "research", "personal"]
              : ["general", "education", "career", "research", "personal"];
            const idx = tabs.indexOf(tab);
            return (
              <div className="flex items-center gap-3">
                <span
                  className="font-mono font-black text-2xl tabular-nums"
                  style={{
                    color: "var(--kvis-green-light)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="flex gap-1">
                  {tabs.map((t, j) => (
                    <div
                      key={t}
                      className="h-1 w-6 transition-colors"
                      style={{
                        background:
                          j <= idx
                            ? "var(--kvis-purple)"
                            : "var(--kvis-border)",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-xs uppercase tracking-[0.22em] hidden sm:block"
                  style={{ color: "var(--kvis-text2)" }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </span>
              </div>
            );
          })()}

          <div className="flex items-center gap-3">
            {tab !== "general" && (
              <button
                type="button"
                onClick={() => {
                  const tabs = isStudent
                    ? ["general", "research", "personal"]
                    : [
                        "general",
                        "education",
                        "career",
                        "research",
                        "personal",
                      ];
                  const idx = tabs.indexOf(tab);
                  if (idx > 0) setTab(tabs[idx - 1] as Tab);
                }}
                className="flex items-center gap-1.5 px-5 py-3 text-xs font-bold uppercase tracking-[0.28em] border border-[var(--kvis-border)] bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}
            {(() => {
              const tabs = isStudent
                ? ["general", "research", "personal"]
                : ["general", "education", "career", "research", "personal"];
              const isLast = tabs.indexOf(tab) === tabs.length - 1;
              return isLast ? (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (tab === "general") await handleSubmit(saveGeneral)();
                      else if (tab === "education") await saveEducation();
                      else if (tab === "career") await saveCareer();
                      else if (tab === "research") await saveResearch();
                      else if (tab === "personal") await savePersonal();
                    } catch {
                      /* ignore */
                    }
                    try {
                      await userApi.updateMe({ profile_setup_done: true });
                      await refetch();
                      router.push("/kvisian");
                    } catch {
                      notify.error("Something went wrong, try again.");
                    }
                  }}
                  className="flex items-center gap-2 px-8 py-3 text-xs font-bold uppercase tracking-[0.28em] bg-foreground text-background hover:bg-foreground/90 transition-opacity"
                >
                  <Check className="h-3.5 w-3.5" /> Done - take me in
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    const idx = tabs.indexOf(tab);
                    const next = tabs[idx + 1] as Tab;
                    try {
                      if (tab === "general") await handleSubmit(saveGeneral)();
                      else if (tab === "education") await saveEducation();
                      else if (tab === "career") await saveCareer();
                      else if (tab === "research") await saveResearch();
                      else if (tab === "personal") await savePersonal();
                    } catch {
                      /* don't block */
                    }
                    setTab(next);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center gap-2 px-8 py-3 text-xs font-bold uppercase tracking-[0.28em] bg-foreground text-background hover:bg-foreground/90 transition-opacity"
                >
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </button>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
