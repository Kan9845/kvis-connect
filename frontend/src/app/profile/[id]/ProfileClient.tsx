"use client";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Dot, ShieldCheck, Mail, Globe } from "lucide-react";
import { userApi, blogApi } from "@/lib/api";
import { keys } from "@/lib/cache/keys";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { degreeLabel } from "@/lib/constants/options";
import { PageEntrance, FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";
import type { BlogRead } from "@/lib/types";
import { cohortColorHex, cohortColorSoftHex, formatDate, cohortLabel, isFaculty, facultyPeriodLabel, FACULTY_COLOR, FACULTY_COLOR_HEX, FACULTY_COLOR_SOFT_HEX } from "@/lib/utils";
import { RESEARCH_CATEGORIES, CURRENT_STATUS_OPTIONS } from "@/app/profile/edit/constants";
import { AvatarCanvas } from "@/components/avatar/AvatarCanvas";

function parseInterests(t?: string) {
  return (t ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}

function hostname(url: string) {
  try {
    const u = new URL(normalizeHref(url));
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname.replace(/\/$/, "");
    return path ? host + path : host;
  }
  catch { return url; }
}

function normalizeHref(raw: string) {
  const value = raw.trim();
  if (!value) return value;
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(value) || /^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return value;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return `mailto:${value}`;
  }
  if (/^(?:localhost|[\w-]+(?:\.[\w-]+)+)(?::\d+)?(?:[/?#]|$)/i.test(value)) {
    return `https://${value}`;
  }
  return value;
}

function parseTags(t?: string) {
  return (t ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}

function SectionHead({ numeral, kicker }: { numeral: string; kicker: React.ReactNode }) {
  return (
    <header className="pt-xl pb-md">
      <div className="flex items-baseline gap-3">
        <span className="font-mono font-black text-xl tabular-nums text-[var(--kvis-green-light)]" style={{ letterSpacing: "-0.02em" }}>
          {numeral}
        </span>
        <span className="text-xs uppercase tracking-[0.28em] font-bold text-[var(--kvis-text3)]">
          {kicker}
        </span>
      </div>
    </header>
  );
}

function SubHead({ label }: { label: string }) {
  return (
    <div className="pt-lg pb-md">
      <span className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)]">{label}</span>
    </div>
  );
}

function EntryRow({ index, title, subtitle, meta, pill, years }: {
  index: number; title: string; subtitle?: string;
  meta?: string; pill?: { label: string; color: string }; years?: string;
}) {
  return (
    <div className="grid items-baseline py-lg border-b border-[var(--kvis-border)]"
      style={{ gridTemplateColumns: "1.75rem minmax(0, 1fr) auto", columnGap: "1.25rem" }}>
      <span className="text-xs font-mono tabular-nums font-semibold pt-1 text-[var(--kvis-text3)]">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-xl md:text-2xl font-bold text-foreground leading-tight tracking-[-0.01em]" style={{ wordBreak: "break-word" }}>
            {title}
          </p>
          {pill && (
            <span className="px-1.5 py-0.5 text-xs font-bold uppercase tracking-[0.22em] leading-none text-white"
              style={{ background: pill.color }}>
              {pill.label}
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm md:text-base mt-1.5 leading-snug" style={{ color: "var(--kvis-text2)" }}>{subtitle}</p>}
        {meta && <p className="text-xs uppercase tracking-[0.22em] mt-sm tabular-nums text-[var(--kvis-text3)]">{meta}</p>}
      </div>
      <span className="text-sm font-mono tabular-nums text-right whitespace-nowrap text-[var(--kvis-text3)]">
        {years ?? "-"}
      </span>
    </div>
  );
}

const BRAND_SVG: Record<string, { color: string; d: string[] }> = {
  LinkedIn:  { color: "#0A66C2", d: ["M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"] },
  Facebook:  { color: "#1877F2", d: ["M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"] },
  Instagram: { color: "#E1306C", d: ["M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"] },
  LINE:      { color: "#06C755", d: ["M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"] },
  GitHub:    { color: "#24292e", d: ["M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"] },
};

function BrandIcon({ label, href }: { label: string; href: string }) {
  const cls = "h-4 w-4 shrink-0 text-foreground";
  if (label === "Email") return <Mail className={cls} />;
  const brand = BRAND_SVG[label] ?? (href.includes("github") ? BRAND_SVG.GitHub : null);
  if (!brand) return <Globe className={cls} />;
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" style={{ fill: "currentColor" }} aria-hidden>
      {brand.d.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

function ContactRow({ label, display, href }: { label: string; display: string; href: string }) {
  const resolvedHref = normalizeHref(href);
  const external = /^https?:/i.test(resolvedHref);
  return (
    <a
      href={resolvedHref}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex items-center gap-4 py-md border-b border-[var(--kvis-border)]"
    >
      <BrandIcon label={label} href={resolvedHref} />
      <span className="flex-1 text-sm text-foreground truncate group-hover:underline decoration-2 underline-offset-[5px] decoration-[var(--kvis-purple)]">
        {display}
      </span>
      <ExternalLink className="h-4 w-4 shrink-0 text-[var(--kvis-text3)]" />
    </a>
  );
}

function StoryCard({ blog, ringColor }: { blog: BlogRead; ringColor: string }) {
  const tags = parseTags(blog.tags);
  const authorYear = blog.author.kvis_year;
  const fallbackColor =
    typeof authorYear === "number" ? cohortColorHex(authorYear) : FACULTY_COLOR_HEX;
  return (
    <Link href={`/blog/${blog.slug}`} className="group block h-full">
      <div className="overflow-hidden border border-[var(--kvis-border)] transition-all duration-300 group-hover:border-[var(--kvis-purple)] h-full flex flex-col"
        style={{ background: "var(--kvis-bg)" }}>
        <div className="relative w-full aspect-[4/3] overflow-hidden flex-shrink-0">
          {blog.cover_image_url ? (
            <Image
              src={blog.cover_image_url}
              alt={blog.title}
              fill
              unoptimized
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `repeating-linear-gradient(135deg, ${fallbackColor} 0, ${fallbackColor} 1px, transparent 0, transparent 50%)`,
              backgroundSize: "8px 8px",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "var(--background)", opacity: 0.82 }} />
            </div>
          )}
        </div>
        <div className="p-3 flex flex-col flex-1">
          {tags[0] && (
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--kvis-text3)] mb-1">{tags[0]}</p>
          )}
          <h3 className="text-sm font-bold leading-[1.25] text-foreground line-clamp-2 group-hover:underline decoration-2 underline-offset-[3px]"
            style={{ textDecorationColor: ringColor }}>
            {blog.title}
          </h3>
          <p className="text-xs text-[var(--kvis-text3)] mt-auto pt-2 font-mono">
            {blog.published_at ? formatDate(blog.published_at) : "Draft"}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function ProfileClient({ params }: { params: { id: string } }) {
  const slug = params.id;
  const { user: me } = useAuth();

  const { data: user, isLoading, error } = useQuery({
    queryKey: keys.user.detail(slug),
    queryFn: () => userApi.getUser(slug),
  });

  const { data: allBlogs = [] } = useQuery({
    queryKey: keys.blog.list({ limit: 100 }),
    queryFn: () => blogApi.list({ limit: 100 }),
    enabled: !!user,
  });

  const userBlogs = allBlogs.filter(
    b => b.author.id === user?.id ||
      `${b.author.first_name} ${b.author.last_name}` === `${user?.first_name} ${user?.last_name}`
  );

  if (isLoading) {
    return (
      <PageEntrance>
        <div className="min-h-full bg-background">
          <div className="mx-auto max-w-5xl px-4 md:px-6 py-xl lg:py-layout">
            <Skeleton className="h-4 w-48 mb-4" />
            <div className="grid gap-lg md:gap-xl pb-lg border-b border-[var(--kvis-border)]"
              style={{ gridTemplateColumns: "auto 1fr" }}>
              <Skeleton className="w-20 sm:w-28 md:w-40 aspect-square" />
              <div className="space-y-4 pt-1">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="pt-14 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          </div>
        </div>
      </PageEntrance>
    );
  }

  if (error || !user) {
    return (
      <PageEntrance>
        <div className="min-h-full bg-background">
          <div className="mx-auto max-w-5xl px-4 md:px-6 py-24 text-center">
            <p className="text-xs uppercase tracking-[0.28em] font-bold mb-4 text-[var(--kvis-text3)]">404</p>
            <p className="text-4xl font-black tracking-tight text-foreground mb-3">Profile not found</p>
            <p className="text-sm" style={{ color: "var(--kvis-text2)" }}>
              <Link href="/kvisian" className="underline text-[var(--kvis-purple)]">Browse the directory</Link>
            </p>
          </div>
        </div>
      </PageEntrance>
    );
  }

  const isMe = me?.slug === slug;
  const canSee = (isPublic: boolean | undefined) => (isPublic ?? true) || !!me;
  const initials = `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase();
  const interests = parseInterests(user.interests);
  const currentRole = user.career?.find((c) => c.is_current) ?? user.career?.[0];
  const currentEdu = user.education?.find((e) => e.is_current);
  const cohortYear =
    !isFaculty(user) && typeof user.kvis_year === "number"
      ? user.kvis_year
      : undefined;

  const ringColor =
    cohortYear === undefined ? FACULTY_COLOR : cohortColorHex(cohortYear);

  // Group research interests by category
  const groupedInterests = RESEARCH_CATEGORIES
    .map(cat => ({
      group: cat.group,
      matched: (user.research_interests ?? []).filter(r => cat.options.includes(r)),
    }))
    .filter(g => g.matched.length > 0);

  const contacts: { label: string; display: string; href: string }[] = [];
  if (user.contact_email && canSee(user.contact_email_public)) contacts.push({ label: "Email", display: user.contact_email, href: `mailto:${user.contact_email}` });
  if (user.linkedin_url && canSee(user.linkedin_public ?? true)) contacts.push({ label: "LinkedIn", display: hostname(user.linkedin_url), href: user.linkedin_url });
  if (user.facebook_url && canSee(user.facebook_public ?? true)) contacts.push({ label: "Facebook", display: hostname(user.facebook_url), href: user.facebook_url });
  if (user.instagram_url && canSee(user.instagram_public ?? true)) contacts.push({ label: "Instagram", display: hostname(user.instagram_url), href: user.instagram_url });
  if (user.website_url && canSee(user.website_public ?? true)) contacts.push({ label: "Website", display: hostname(user.website_url), href: user.website_url });
  if (user.line_id && canSee(user.line_id_public ?? true)) contacts.push({ label: "LINE", display: user.line_id, href: `https://line.me/ti/p/~${user.line_id}` });
  (user.extra_contacts ?? []).forEach((ec: any) => {
    if (!ec.public) return;
    contacts.push({ label: ec.type, display: ec.value, href: ec.value.startsWith("http") ? ec.value : `mailto:${ec.value}` });
  });
  (user.portfolio_links ?? []).forEach((pl) => {
    contacts.push({ label: pl.type, display: hostname(pl.url), href: pl.url });
  });

  const hasResearch =
    groupedInterests.length > 0 ||
    (user.projects?.length ?? 0) > 0 ||
    (user.publications?.length ?? 0) > 0 ||
    ((user as any).launches?.length ?? 0) > 0;

  const hasPersonality = !!me && (!!user.mbti || !!user.zodiac || !!user.chronotype);

  const hasHobbies = !!me && !!user.hobbies && Object.values(
    typeof user.hobbies === 'string' ? JSON.parse(user.hobbies) : user.hobbies
  ).some((v: any) => Array.isArray(v) ? v.length > 0 : !!v);

  const hasNostalgia = !!me && !!(user.kvis_fav_menu || user.kvis_fav_event || user.kvis_fav_area);
  const hasActivities = (user.activities?.length ?? 0) > 0;
  const hasExperience =
    ((user as any).competitions?.length ?? 0) > 0 ||
    ((user as any).experience_camps?.length ?? 0) > 0 ||
    ((user as any).clubs?.length ?? 0) > 0;

  const sections: { key: string; label: string }[] = [];
  if (user.bio) sections.push({ key: "bio", label: "About" });
  if (user.education?.length) sections.push({ key: "education", label: "Schooling" });
  if (user.career?.length) sections.push({ key: "career", label: "Work" });
  if (hasExperience) sections.push({ key: "experience", label: "Experience" });
  if (hasResearch) sections.push({ key: "research", label: "Research" });
  if (contacts.length) sections.push({ key: "contact", label: "Get in touch" });
  if (hasPersonality) sections.push({ key: "personality", label: "Vibe" });
  if (hasActivities) sections.push({ key: "activities", label: "Activities & Awards" });
  if (hasHobbies) sections.push({ key: "hobbies", label: "Hobbies" });
  if (hasNostalgia) sections.push({ key: "nostalgia", label: "KVIS Nostalgia" });
  if (userBlogs.length) sections.push({ key: "posts", label: "Writing" });

  const numeralFor = (key: string) => {
    const idx = sections.findIndex((s) => s.key === key);
    return ["I.", "II.", "III.", "IV.", "V.", "VI.", "VII.", "VIII.", "IX."][idx] ?? "-";
  };

  return (
    <PageEntrance>
      <div className="min-h-full bg-background">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-xl lg:py-layout">

          {/* ── HEADER ─────────────────────────────────────────────────────── */}
          <FadeUp>
            <header className="pb-lg border-b border-[var(--kvis-border)]">
              <div className="grid items-start gap-md md:gap-xl mb-8"
                style={{ gridTemplateColumns: "auto 1fr" }}>

                {/* Avatar */}
                <div className="relative overflow-hidden shrink-0 w-20 sm:w-28 md:w-40 rounded-full">
                  {user.goose_config ? (
                    <AvatarCanvas config={(() => { try { return JSON.parse(user.goose_config); } catch { return {}; } })()} backgroundColor="var(--kvis-green)" />
                  ) : (
                    <div className="relative w-full" style={{ paddingBottom: "100%" }}>
                      {user.profile_pic_url ? (
                        <Image src={user.profile_pic_url} alt={`${user.first_name} ${user.last_name}`}
                          fill sizes="(max-width: 640px) 80px, (max-width: 768px) 112px, 160px"
                          unoptimized
                          className="object-cover" priority />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center font-black text-2xl sm:text-3xl md:text-4xl"
                          style={{
                            background:
                              cohortYear === undefined ? FACULTY_COLOR_HEX : cohortColorHex(cohortYear),
                            color: "white",
                          }}>
                          {initials}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Name + role + tags */}
                <div className="min-w-0 pt-1 overflow-hidden">
                  <div className="flex items-center gap-sm mb-3 flex-wrap">
                    {isFaculty(user) ? (
                      <>
                        <span className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--kvis-text3)]">
                          KVIS Connect <Dot className="inline h-3 w-3" aria-hidden /> Faculty
                        </span>
                        <span className="text-xs font-bold uppercase tracking-[0.18em] px-2 py-0.5"
                          style={{ background: FACULTY_COLOR_SOFT_HEX, color: FACULTY_COLOR_HEX }}>
                          Teacher <Dot className="inline h-3 w-3" aria-hidden /> {facultyPeriodLabel(user)}
                        </span>
                      </>
                    ) : user.current_grade ? (
                      <span className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--kvis-text3)]">
                        KVIS Connect <Dot className="inline h-3 w-3" aria-hidden /> Student
                      </span>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--kvis-text3)]">
                        KVIS Connect <Dot className="inline h-3 w-3" aria-hidden /> Alumni
                      </span>
                    )}
                    {user.is_verified && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--kvis-text3)]">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>

                  <h1 className="font-display text-4xl sm:text-5xl font-black tracking-[-0.035em] leading-[0.9] text-foreground break-words">
                    {user.first_name} {user.last_name}
                    {user.nickname && user.nickname_public && (
                      <span className="font-normal text-2xl sm:text-3xl ml-2" style={{ color: "var(--kvis-text3)" }}>
                        ({user.nickname})
                      </span>
                    )}
                  </h1>

                  {(currentRole || user.place || user.place_level2 || user.country) && (
                    <p className="text-sm mt-3 flex items-center flex-wrap gap-1" style={{ color: "var(--kvis-text2)" }}>
                      {currentEdu ? (
                        <span>{currentEdu.major}{currentEdu.uni_name && ` @ ${currentEdu.uni_name}`}</span>
                      ) : currentRole ? (
                        <span>{currentRole.job_title}{currentRole.employer && ` @ ${currentRole.employer}`}</span>
                      ) : null}
                      {(user.place || user.place_level2 || user.country) && (
                        <>
                          {currentRole && <Dot className="h-3 w-3 shrink-0" aria-hidden />}
                          <span>{[user.place, user.place_level2, user.country].filter(Boolean).join(", ")}</span>
                        </>
                      )}
                    </p>
                  )}

                  {(interests.length > 0 ||
                    user.province_of_origin ||
                    user.current_status ||
                    (!user.current_grade && cohortYear !== undefined)) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {cohortYear !== undefined && !user.current_grade && (
                        <span
                          className="text-xs font-bold uppercase tracking-[0.1em] px-2.5 py-1"
                          style={{
                            background: cohortColorSoftHex(cohortYear),
                            color: cohortColorHex(cohortYear),
                          }}
                        >
                          {cohortLabel(cohortYear)}
                        </span>
                      )}
                  
                      {user.current_status && (() => {
                        const label = CURRENT_STATUS_OPTIONS.flatMap((g) => g.options).find(
                          (o) => o.value === user.current_status,
                        )?.label;
                      
                        return label ? (
                          <span className="text-xs font-bold uppercase tracking-[0.1em] px-2.5 py-1 border border-[var(--kvis-border)] text-[var(--kvis-text3)]">
                            {label}
                          </span>
                        ) : null;
                      })()}
                  
                      {user.province_of_origin && (
                        <span className="text-xs font-bold uppercase tracking-[0.1em] px-2.5 py-1 border border-[var(--kvis-border)] text-[var(--kvis-text3)]">
                          Origin: {user.province_of_origin}
                        </span>
                      )}
                  
                      {(user.interests_public !== false || !!me) &&
                        interests.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="text-xs font-semibold uppercase tracking-[0.1em] px-2.5 py-1 border border-[var(--kvis-border)] text-[var(--kvis-text3)]"
                          >
                            {t}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Meta bar */}
              <div className="flex items-center justify-between flex-wrap gap-md">
                <div className="flex items-center gap-3 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap text-[var(--kvis-text3)]">
                  <span>Joined {formatDate(user.created_at).toUpperCase()}</span>
                  <Dot className="h-3 w-3 shrink-0" aria-hidden />
                  <span>{user.education?.length ?? 0} {(user.education?.length ?? 0) === 1 ? "school" : "schools"}</span>
                  <Dot className="h-3 w-3 shrink-0" aria-hidden />
                  <span>{user.career?.length ?? 0} {(user.career?.length ?? 0) === 1 ? "role" : "roles"}</span>
                  {userBlogs.length > 0 && (
                    <><Dot className="h-3 w-3 shrink-0" aria-hidden />
                    <span>{userBlogs.length} {userBlogs.length === 1 ? "post" : "posts"}</span></>
                  )}
                </div>
                {isMe && (
                  <Link href="/profile/edit"
                    className="px-5 py-2.5 text-xs font-bold uppercase tracking-[0.28em] bg-foreground text-background hover:bg-foreground/90 transition-opacity">
                    Edit profile
                  </Link>
                )}
              </div>
            </header>
          </FadeUp>

          {sections.length === 0 && (
            <FadeUp>
              <div className="py-2xl">
                <p className="text-xs uppercase tracking-[0.28em] font-bold text-[var(--kvis-text3)] mb-3">No data yet</p>
                <p className="text-lg text-foreground max-w-[42ch] leading-snug">
                  This profile hasn&apos;t been filled in yet.
                </p>
                {isMe && (
                  <Link href="/profile/edit"
                    className="inline-block mt-lg px-5 py-2.5 text-xs font-bold uppercase tracking-[0.28em] bg-foreground text-background hover:bg-foreground/90 transition-opacity">
                    Fill in your profile
                  </Link>
                )}
              </div>
            </FadeUp>
          )}

          {/* ── BIO ─────────────────────────────────────────────────────────── */}
          {user.bio && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("bio")} kicker="About" />
                <p className="text-lg md:text-xl leading-relaxed text-foreground max-w-[62ch]">{user.bio}</p>
              </section>
            </FadeUp>
          )}

          {/* ── EDUCATION ───────────────────────────────────────────────────── */}
          {user.education?.length > 0 && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("education")} kicker="Schooling" />
                <StaggerList>
                  {user.education.map((e, i) => {
                    const place = [e.city, e.state, e.country].filter(Boolean).join(", ");
                    const majors = [e.major, e.major2].filter(Boolean).join(" + ");
                    const isMed = !!e.med_school;
                    const subtitle = isMed
                      ? [degreeLabel(e.degree), e.med_school].filter(Boolean).join(" / ")
                      : [degreeLabel(e.degree), majors].filter(Boolean).join(" / ");
                    const metaParts: string[] = [];
                    if (place) metaParts.push(place);
                    if (!isMed) {
                      const allMinors = (e.minors && e.minors.length > 0) ? e.minors : (e.minor1 ? [e.minor1] : []);
                      if (allMinors.length > 0) metaParts.push(`Minor: ${allMinors.join(", ")}`);
                    }
                    if (isMed && (e.med_specialties ?? []).length > 0) metaParts.push((e.med_specialties ?? []).join(", "));
                    if (isMed && e.med_hospital) metaParts.push(e.med_hospital);
                    if (e.scholarship?.length) {
                      metaParts.push(`${e.scholarship.join(", ")} Scholar`);
                    }
                    const years = e.start_year || e.end_year || e.is_current
                      ? `${e.start_year ?? "?"} - ${e.is_current ? "Present" : e.end_year ?? "?"}`
                      : undefined;
                    return (
                      <StaggerItem key={e.id}>
                        <EntryRow index={i} title={e.uni_name} subtitle={subtitle}
                          meta={metaParts.join("  /  ") || undefined} years={years}
                          pill={e.is_current ? { label: "Current", color: "var(--kvis-green-light)" } : undefined}/>
                      </StaggerItem>
                    );
                  })}
                </StaggerList>
              </section>
            </FadeUp>
          )}

          {/* ── CAREER ──────────────────────────────────────────────────────── */}
          {user.career?.length > 0 && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("career")} kicker="Work" />
                <StaggerList>
                  {user.career.map((c, i) => {
                    const place = [c.city, c.state, c.country].filter(Boolean).join(", ");
                    const subtitle = c.employer ?? "";
                    const metaParts: string[] = [];
                    if (place) metaParts.push(place);
                    if (c.company_type) metaParts.push(c.company_type);
                    if (c.industry_sector) metaParts.push(c.industry_sector);
                    const years = c.start_year || c.end_year
                      ? `${c.start_year ?? "?"} - ${c.is_current ? "Present" : c.end_year ?? "?"}`
                      : c.is_current ? "Present" : undefined;
                    return (
                      <StaggerItem key={c.id}>
                        <EntryRow index={i} title={c.job_title} subtitle={subtitle}
                          meta={metaParts.join("  /  ") || undefined}
                          pill={c.is_current ? { label: "Current", color: "var(--kvis-green-light)" } : undefined}
                          years={years} />
                      </StaggerItem>
                    );
                  })}
                </StaggerList>
              </section>
            </FadeUp>
          )}

          {/* ── EXPERIENCE ──────────────────────────────────────────────────── */}
          {hasExperience && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("experience")} kicker="Experience" />

                {/* Competitions */}
                {((user as any).competitions ?? []).length > 0 && (
                  <>
                    <SubHead label="Competitions & Fairs" />
                    <StaggerList>
                      {((user as any).competitions ?? []).map((c: any, i: number) => (
                        <StaggerItem key={i}>
                          <div className="grid items-baseline py-lg border-b border-[var(--kvis-border)]"
                            style={{ gridTemplateColumns: "1.75rem minmax(0, 1fr) auto", columnGap: "1.25rem" }}>
                            <span className="text-xs font-mono tabular-nums font-semibold pt-1 text-[var(--kvis-text3)]">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <p className="text-xl font-bold text-foreground leading-tight tracking-[-0.01em]">{c.event_name}</p>
                                {c.result && (
                                  <span className="text-xs font-bold uppercase tracking-[0.18em] px-1.5 py-0.5 border border-[var(--kvis-border)] text-[var(--kvis-text3)]">
                                    {c.result === "Other" && c.result_other ? c.result_other : c.result}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm mt-1 leading-snug" style={{ color: "var(--kvis-text2)" }}>
                                {[
                                  c.competition_type === "Other" ? c.competition_type_other : c.competition_type,
                                  c.scope,
                                  c.year,
                                ].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                          </div>
                        </StaggerItem>
                      ))}
                    </StaggerList>
                  </>
                )}

                {/* Camps & Programs */}
                {((user as any).experience_camps ?? []).length > 0 && (
                  <>
                    <SubHead label="Camps & Programs" />
                    <StaggerList>
                      {((user as any).experience_camps ?? []).map((c: any, i: number) => (
                        <StaggerItem key={i}>
                          <div className="grid items-baseline py-lg border-b border-[var(--kvis-border)]"
                            style={{ gridTemplateColumns: "1.75rem minmax(0, 1fr)", columnGap: "1.25rem" }}>
                            <span className="text-xs font-mono tabular-nums font-semibold pt-1 text-[var(--kvis-text3)]">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xl font-bold text-foreground leading-tight tracking-[-0.01em]">{c.program_name}</p>
                              <p className="text-sm mt-1 leading-snug" style={{ color: "var(--kvis-text2)" }}>
                                {[
                                  c.program_type === "Other" ? c.program_type_other : c.program_type,
                                  c.role,
                                  c.country,
                                  c.year,
                                ].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                          </div>
                        </StaggerItem>
                      ))}
                    </StaggerList>
                  </>
                )}

                {/* Clubs & Volunteering */}
                {((user as any).clubs ?? []).length > 0 && (
                  <>
                    <SubHead label="Clubs & Volunteering" />
                    <StaggerList>
                      {((user as any).clubs ?? []).map((c: any, i: number) => (
                        <StaggerItem key={i}>
                          <div className="grid items-baseline py-lg border-b border-[var(--kvis-border)]"
                            style={{ gridTemplateColumns: "1.75rem minmax(0, 1fr)", columnGap: "1.25rem" }}>
                            <span className="text-xs font-mono tabular-nums font-semibold pt-1 text-[var(--kvis-text3)]">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <p className="text-xl font-bold text-foreground leading-tight tracking-[-0.01em]">{c.org_name}</p>
                                {c.is_current && (
                                  <span className="text-xs font-bold uppercase tracking-[0.18em] px-1.5 py-0.5 text-white"
                                    style={{ background: "var(--kvis-green-light)" }}>
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="text-sm mt-1 leading-snug" style={{ color: "var(--kvis-text2)" }}>
                                {c.role_title}
                                {(c.start_year || c.end_year) && (
                                  <span className="ml-2 text-xs" style={{ color: "var(--kvis-text3)" }}>
                                    {[c.start_month, c.start_year].filter(Boolean).join(" ")}
                                    {(c.end_year || c.is_current) && " – "}
                                    {c.is_current ? "Present" : [c.end_month, c.end_year].filter(Boolean).join(" ")}
                                  </span>
                                )}
                              </p>
                              {c.description && (
                                <p className="text-xs mt-1.5 leading-relaxed max-w-[55ch]" style={{ color: "var(--kvis-text2)" }}>
                                  {c.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </StaggerItem>
                      ))}
                    </StaggerList>
                  </>
                )}
              </section>
            </FadeUp>
          )}

          {/* ── RESEARCH ────────────────────────────────────────────────────── */}
          {hasResearch && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("research")} kicker="Research" />

                {/* Interests grouped by category */}
                {groupedInterests.length > 0 && (
                  <>
                    <StaggerList>
                      {groupedInterests.map((g, i) => (
                        <StaggerItem key={g.group}>
                          <div className="grid items-baseline py-lg border-b border-[var(--kvis-border)]"
                            style={{ gridTemplateColumns: "1.75rem minmax(0, 1fr)", columnGap: "1.25rem" }}>
                            <span className="text-xs font-mono tabular-nums font-semibold pt-1 text-[var(--kvis-text3)]">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0">
                              <p className="text-base font-bold text-foreground tracking-[-0.01em]">{g.group}</p>
                              <p className="text-sm mt-1 leading-relaxed max-w-[60ch]" style={{ color: "var(--kvis-text2)" }}>
                                {g.matched.join("  ·  ")}
                              </p>
                            </div>
                          </div>
                        </StaggerItem>
                      ))}
                    </StaggerList>
                  </>
                )}

                {/* Projects */}
                {(user.projects ?? []).length > 0 && (
                  <>
                    <SubHead label="Projects" />
                    <StaggerList>
                      {(user.projects ?? []).map((p, i) => (
                        <StaggerItem key={i}>
                          <div className="grid items-start py-lg border-b border-[var(--kvis-border)]"
                            style={{ gridTemplateColumns: "1.75rem minmax(0, 1fr) auto", columnGap: "1.25rem" }}>
                            <span className="text-xs font-mono tabular-nums font-semibold pt-1 text-[var(--kvis-text3)]">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <p className="text-xl font-bold text-foreground leading-tight tracking-[-0.01em]">{p.title}</p>
                                {p.status && (
                                  <span className="text-xs font-bold uppercase tracking-[0.18em] px-1.5 py-0.5 border border-[var(--kvis-border)] text-[var(--kvis-text3)]">
                                    {p.status}
                                  </span>
                                )}
                              </div>
                              {[p.advisor, p.advisor2].filter(Boolean).length > 0 && (
                                <p className="text-sm mt-1.5 leading-snug" style={{ color: "var(--kvis-text2)" }}>
                                  Advisor: {[p.advisor, p.advisor2].filter(Boolean).join(", ")}
                                </p>
                              )}
                              {p.description && (
                                <p className="text-xs mt-2 leading-relaxed max-w-[55ch]" style={{ color: "var(--kvis-text2)" }}>
                                  {p.description}
                                </p>
                              )}
                            </div>
                            {p.link && (
                              <a href={normalizeHref(p.link)} target="_blank" rel="noopener noreferrer"
                                className="text-[var(--kvis-text3)] hover:text-foreground transition-colors shrink-0 pt-1">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </StaggerItem>
                      ))}
                    </StaggerList>
                  </>
                )}

                {/* Publications */}
                {(user.publications ?? []).length > 0 && (
                  <>
                    <SubHead label="Publications" />
                    <StaggerList>
                      {(user.publications ?? []).map((p, i) => (
                        <StaggerItem key={i}>
                          <div className="grid items-start py-lg border-b border-[var(--kvis-border)]"
                            style={{ gridTemplateColumns: "1.75rem minmax(0, 1fr) auto", columnGap: "1.25rem" }}>
                            <span className="text-xs font-mono tabular-nums font-semibold pt-1 text-[var(--kvis-text3)]">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <p className="text-sm leading-relaxed text-foreground">{p.citation}</p>
                            {p.doi && (
                              <a href={normalizeHref(/^https?:/.test(p.doi) ? p.doi : `https://doi.org/${p.doi}`)}
                                target="_blank" rel="noopener noreferrer"
                                className="text-[var(--kvis-text3)] hover:text-foreground transition-colors shrink-0 pt-0.5">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </StaggerItem>
                      ))}
                    </StaggerList>
                  </>
                )}

                {/* Launches & Innovations */}
                {((user as any).launches ?? []).length > 0 && (
                  <>
                    <SubHead label="Launches & Innovations" />
                    <StaggerList>
                      {((user as any).launches ?? []).map((l: any, i: number) => (
                        <StaggerItem key={i}>
                          <div className="grid items-start py-lg border-b border-[var(--kvis-border)]"
                            style={{ gridTemplateColumns: "1.75rem minmax(0, 1fr) auto", columnGap: "1.25rem" }}>
                            <span className="text-xs font-mono tabular-nums font-semibold pt-1 text-[var(--kvis-text3)]">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <p className="text-xl font-bold text-foreground leading-tight tracking-[-0.01em]">{l.name}</p>
                                {l.status && (
                                  <span className="text-xs font-bold uppercase tracking-[0.18em] px-1.5 py-0.5 border border-[var(--kvis-border)] text-[var(--kvis-text3)]">
                                    {l.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm mt-1.5 leading-snug" style={{ color: "var(--kvis-text2)" }}>
                                {l.innovation_type === "Other" && l.innovation_type_other
                                  ? l.innovation_type_other
                                  : l.innovation_type}
                                {l.role && <> · {l.role}</>}
                              </p>
                              {l.description && (
                                <p className="text-xs mt-2 leading-relaxed max-w-[55ch]" style={{ color: "var(--kvis-text2)" }}>
                                  {l.description}
                                </p>
                              )}
                            </div>
                            {l.link && (
                              <a href={normalizeHref(l.link)} target="_blank" rel="noopener noreferrer"
                                className="text-[var(--kvis-text3)] hover:text-foreground transition-colors shrink-0 pt-1">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </StaggerItem>
                      ))}
                    </StaggerList>
                  </>
                )}
              </section>
            </FadeUp>
          )}

          {/* ── CONTACTS ────────────────────────────────────────────────────── */}
          {contacts.length > 0 && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("contact")} kicker="Get in touch" />
                <StaggerList>
                  {contacts.map((c) => (
                    <StaggerItem key={c.label}>
                      <ContactRow {...c} />
                    </StaggerItem>
                  ))}
                </StaggerList>
              </section>
            </FadeUp>
          )}

          {/* ── PERSONALITY ─────────────────────────────────────────────────── */}
          {hasPersonality && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("personality")} kicker="Vibe" />
                <div className="flex items-start gap-2xl flex-wrap pb-lg border-b border-[var(--kvis-border)]">
                  {user.mbti && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)] mb-1">
                        MBTI
                      </p>
                      <p className="text-2xl font-bold text-foreground tracking-[-0.01em]">
                        {user.mbti}
                      </p>
                    </div>
                  )}
                  {user.zodiac && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)] mb-1">Zodiac</p>
                      <p className="text-2xl font-bold text-foreground tracking-[-0.01em]">{user.zodiac}</p>
                    </div>
                  )}
                  {user.chronotype && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)] mb-1">Chronotype</p>
                      <p className="text-2xl font-bold text-foreground tracking-[-0.01em]">{user.chronotype}</p>
                    </div>
                  )}
                </div>
              </section>
            </FadeUp>
          )}

          {/* ── ACTIVITIES & AWARDS ─────────────────────────────────────────── */}
          {hasActivities && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("activities")} kicker="Activities & Awards" />
                {(() => {
                  const byYear = new Map<string, typeof user.activities>();
                  user.activities!.forEach(a => {
                    const k = a.year ? String(a.year) : "";
                    if (!byYear.has(k)) byYear.set(k, []);
                    byYear.get(k)!.push(a);
                  });
                  const sorted = Array.from(byYear.entries()).sort(([a], [b]) => {
                    if (!a) return 1;
                    if (!b) return -1;
                    return Number(b) - Number(a);
                  });
                  return sorted.map(([year, items]) => (
                    <div key={year} className="grid py-lg border-b border-[var(--kvis-border)]"
                      style={{ gridTemplateColumns: "4rem minmax(0, 1fr)", columnGap: "1.25rem" }}>
                      <span className="text-sm font-mono tabular-nums font-semibold text-[var(--kvis-text3)] pt-0.5 shrink-0">
                        {year || "-"}
                      </span>
                      <div className="space-y-2">
                        {items!.map((a, i) => (
                          <p key={i} className="text-sm text-foreground leading-snug">
                            <span className="font-bold">{a.title}</span>
                            {a.description && (
                              <span className="text-[var(--kvis-text2)]"> - {a.description}</span>
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </section>
            </FadeUp>
          )}

          {/* ── HOBBIES ─────────────────────────────────────────────────────── */}
          {hasHobbies && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("hobbies")} kicker="Hobbies & Interests" />
                <div className="pb-lg border-b border-[var(--kvis-border)]">
                  {Object.entries(typeof user.hobbies === 'string' ? JSON.parse(user.hobbies) : user.hobbies)
                    .filter(([_, v]: any) => Array.isArray(v) ? v.length > 0 : !!v)
                    .map(([category, items]: any) => (
                      <div key={category} className="pt-lg">
                        <p className="text-xs font-bold uppercase tracking-[0.26em] text-[var(--kvis-text3)] mb-3">
                          {category}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(items) ? items : [items]).map((item: string) => (
                            <span key={item}
                              className="px-2.5 py-1 text-xs font-semibold border border-[var(--kvis-border)] text-[var(--kvis-text3)]">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            </FadeUp>
          )}

          {/* ── KVIS NOSTALGIA ──────────────────────────────────────────────── */}
          {!!me && (user.kvis_fav_menu || user.kvis_fav_event || user.kvis_fav_area) && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("nostalgia")} kicker="KVIS Nostalgia" />
                <div className="flex items-start gap-2xl flex-wrap pb-lg border-b border-[var(--kvis-border)]">
                  {user.kvis_fav_menu && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)] mb-1">Fav Menu</p>
                      <p className="text-2xl font-bold text-foreground tracking-[-0.01em]">{user.kvis_fav_menu}</p>
                    </div>
                  )}
                  {user.kvis_fav_event && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)] mb-1">Fav Event</p>
                      <p className="text-2xl font-bold text-foreground tracking-[-0.01em]">{user.kvis_fav_event}</p>
                    </div>
                  )}
                  {user.kvis_fav_area && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)] mb-1">Fav Area</p>
                      <p className="text-2xl font-bold text-foreground tracking-[-0.01em]">{user.kvis_fav_area}</p>
                    </div>
                  )}
                </div>
              </section>
            </FadeUp>
          )}

          {/* ── WRITING ─────────────────────────────────────────────────────── */}
          {userBlogs.length > 0 && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("posts")} kicker="Writing" />
                <StaggerList>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-stretch">
                    {userBlogs.map((b) => (
                      <StaggerItem key={b.id} className="h-full">
                        <StoryCard blog={b} ringColor={ringColor} />
                      </StaggerItem>
                    ))}
                  </div>
                </StaggerList>
              </section>
            </FadeUp>
          )}

          {/* ── FOOTER ──────────────────────────────────────────────────────── */}
          <FadeUp>
            <footer className={`pt-lg ${sections.length === 0 ? "border-t border-[var(--kvis-border)]" : ""} text-xs uppercase tracking-[0.22em] flex items-center justify-between`}
              style={{ color: "var(--kvis-text2)" }}>
              <span>- end -</span>
              <span className="tabular-nums flex items-center gap-1">
                KVIS Connect <Dot className="h-3 w-3 shrink-0" aria-hidden /> {new Date().getFullYear()}
              </span>
            </footer>
          </FadeUp>

        </div>
      </div>
    </PageEntrance>
  );
}
