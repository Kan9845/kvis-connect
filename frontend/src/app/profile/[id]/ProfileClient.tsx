"use client";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Dot, ShieldCheck } from "lucide-react";
import { userApi } from "@/lib/api";
import { keys } from "@/lib/cache/keys";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { degreeLabel, jobFieldLabel } from "@/lib/constants/options";
import { formatDate, genLabel } from "@/lib/utils";
import { PageEntrance, FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";

const P = {
  purple: "oklch(44% 0.26 294)",
  purpleSoft: "oklch(95% 0.035 294)",
  green: "oklch(40% 0.16 148)",
  text3: "oklch(62% 0.005 294)",
  rule: "oklch(90% 0.007 294)",
};

function parseInterests(t?: string) {
  return (t ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

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

function EntryRow({
  index,
  title,
  subtitle,
  meta,
  pill,
  years,
}: {
  index: number;
  title: string;
  subtitle?: string;
  meta?: string;
  pill?: { label: string; color: string };
  years?: string;
}) {
  return (
    <div
      className="grid items-baseline py-6 border-b"
      style={{
        borderColor: P.rule,
        gridTemplateColumns: "1.75rem minmax(0, 1fr) auto",
        columnGap: "1.25rem",
      }}
    >
      <span
        className="text-xs font-mono tabular-nums font-semibold pt-1"
        style={{ color: P.text3 }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <p
            className="text-xl md:text-2xl font-bold text-foreground leading-tight tracking-[-0.01em]"
            style={{ wordBreak: "break-word" }}
          >
            {title}
          </p>
          {pill && (
            <Badge
              className="rounded-none border-transparent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em] leading-none text-white hover:bg-[oklch(40%_0.16_148)]"
              style={{ background: pill.color }}
            >
              {pill.label}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-sm md:text-[15px] text-muted-foreground mt-1.5 leading-snug">
            {subtitle}
          </p>
        )}
        {meta && (
          <p
            className="text-xs uppercase tracking-[0.22em] mt-2 tabular-nums"
            style={{ color: P.text3 }}
          >
            {meta}
          </p>
        )}
      </div>
      <span
        className="text-sm font-mono tabular-nums text-right whitespace-nowrap"
        style={{ color: P.text3 }}
      >
        {years ?? "-"}
      </span>
    </div>
  );
}

function ContactRow({
  label,
  display,
  href,
}: {
  label: string;
  display: string;
  href: string;
}) {
  const external = /^https?:/.test(href);
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group grid items-center py-4 border-b"
      style={{
        borderColor: P.rule,
        gridTemplateColumns: "100px minmax(0, 1fr) auto",
        columnGap: "1.25rem",
      }}
    >
      <span
        className="text-xs uppercase tracking-[0.26em] font-bold"
        style={{ color: P.text3 }}
      >
        {label}
      </span>
      <span
        className="text-sm md:text-base text-foreground truncate group-hover:underline decoration-2 underline-offset-[5px]"
        style={{ textDecorationColor: P.purple }}
      >
        {display}
      </span>
      <ExternalLink className="h-4 w-4" style={{ color: P.text3 }} />
    </a>
  );
}

export default function ProfileClient({ params }: { params: { id: string } }) {
  const slug = params.id;
  const { user: me } = useAuth();

  const { data: user, isLoading, error } = useQuery({
    queryKey: keys.user.detail(slug),
    queryFn: () => userApi.getUser(slug),
  });

  if (isLoading) {
    return (
      <PageEntrance>
        <div className="min-h-full bg-background">
          <div className="mx-auto max-w-5xl px-6 lg:px-10 py-10 lg:py-14">
            <Skeleton className="h-4 w-48 mb-4" />
            <div className="grid grid-cols-[140px_1fr] md:grid-cols-[200px_1fr] gap-6 md:gap-10 pb-7 border-b border-foreground/40">
              <Skeleton className="aspect-square w-full" />
              <div className="space-y-4">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="pt-14 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
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
          <div className="mx-auto max-w-5xl px-6 lg:px-10 py-24 text-center">
            <p
              className="text-xs uppercase tracking-[0.28em] font-bold mb-4"
              style={{ color: P.text3 }}
            >
              404
            </p>
            <p className="text-4xl font-black tracking-tight text-foreground mb-3">
              Profile not found
            </p>
            <p className="text-sm text-muted-foreground">
              <Link href="/search" className="underline" style={{ color: P.purple }}>
                Browse the directory
              </Link>
            </p>
          </div>
        </div>
      </PageEntrance>
    );
  }

  const isMe = me?.slug === slug;
  const initials = `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase();
  const interests = parseInterests(user.interests);
  const currentRole = user.career?.find((c) => c.is_current) ?? user.career?.[0];

  const contacts: { label: string; display: string; href: string }[] = [];
  if (user.linkedin_url) contacts.push({ label: "LinkedIn", display: hostname(user.linkedin_url), href: user.linkedin_url });
  if (user.facebook_url) contacts.push({ label: "Facebook", display: hostname(user.facebook_url), href: user.facebook_url });
  if (user.website_url) contacts.push({ label: "Website", display: hostname(user.website_url), href: user.website_url });

  const sections: { key: "bio" | "education" | "career" | "contact"; label: string; title: string }[] = [];
  if (user.bio) sections.push({ key: "bio", label: "About", title: "In their own words" });
  if (user.education?.length) sections.push({ key: "education", label: "Schooling", title: "Where they studied" });
  if (user.career?.length) sections.push({ key: "career", label: "Work", title: "What they do" });
  if (contacts.length) sections.push({ key: "contact", label: "Get in touch", title: "Connect" });

  const numeralFor = (key: string) => {
    const idx = sections.findIndex((s) => s.key === key);
    return ["I.", "II.", "III.", "IV.", "V."][idx] ?? "-";
  };

  return (
    <PageEntrance>
      <div className="min-h-full bg-background">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-10 lg:py-14">

          {/* Masthead */}
          <FadeUp>
            <header className="pb-8 border-b border-foreground/60">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: P.purple }}>
                  KVIS Connect / Alumni Dossier
                </p>
                {isMe && (
                  <Button asChild className="h-auto rounded-none bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90">
                    <Link href="/edit">Edit profile</Link>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] gap-6 md:gap-10 items-start">
                <div className="relative">
                  <div className="aspect-square overflow-hidden bg-muted rounded-full">
                    {user.profile_pic_url ? (
                      <Image
                        src={user.profile_pic_url}
                        alt={`${user.first_name} ${user.last_name}`}
                        fill
                        sizes="(min-width: 768px) 200px, (min-width: 640px) 160px, 120px"
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center text-white font-black tracking-tight"
                        style={{ background: P.purple, fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
                      >
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <h1
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.035em] leading-[0.9] text-foreground"
                    style={{ wordBreak: "break-word" }}
                  >
                    {user.first_name}
                    <br />
                    {user.last_name}
                  </h1>

                  {user.is_verified && (
                    <div className="mt-4 inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color: P.green }} />
                      <span className="text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: P.green }}>
                        KVIS-Verified
                      </span>
                    </div>
                  )}

                  <div className="mt-3 flex items-baseline gap-x-3 gap-y-2 flex-wrap text-xs font-bold uppercase tracking-[0.24em] tabular-nums" style={{ color: P.text3 }}>
                    {user.mbti && <span style={{ color: P.purple }}>{user.mbti}</span>}
                    {user.mbti && user.kvis_year && <Dot className="h-3 w-3 shrink-0" aria-hidden />}
                    {user.kvis_year && <span>KVIS {user.kvis_year}</span>}
                    {user.kvis_year && user.place && <Dot className="h-3 w-3 shrink-0" aria-hidden />}
                    {user.place && <span>{user.place}</span>}
                  </div>

                  {currentRole && (
                    <div className="mt-6">
                      <p className="text-xs uppercase tracking-[0.22em]" style={{ color: P.text3 }}>
                        <span style={{ color: P.green }} className="font-bold">Currently</span>{" "}
                        {currentRole.job_title}
                        {currentRole.employer && ` @ ${currentRole.employer}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-4 mt-7 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap" style={{ color: P.text3 }}>
                <span>Joined {formatDate(user.created_at).toUpperCase()}</span>
                <Dot className="h-3 w-3 shrink-0" aria-hidden />
                <span>{user.education?.length ?? 0} {(user.education?.length ?? 0) === 1 ? "school" : "schools"}</span>
                <Dot className="h-3 w-3 shrink-0" aria-hidden />
                <span>{user.career?.length ?? 0} {(user.career?.length ?? 0) === 1 ? "role" : "roles"}</span>
              </div>
            </header>
          </FadeUp>

          {/* Interests */}
          {interests.length > 0 && (
            <FadeUp delay={0.1}>
              <nav className="grid grid-cols-[72px_1fr] md:grid-cols-[100px_1fr] items-baseline gap-x-5 gap-y-2 py-4 border-b" style={{ borderColor: P.rule }}>
                <span className="text-xs uppercase tracking-[0.26em] font-bold" style={{ color: P.text3 }}>Tags</span>
                <div className="flex items-center flex-wrap gap-y-2.5">
                  {interests.map((t, idx) => (
                    <span key={t} className="flex items-center">
                      {idx > 0 && <Dot className="h-3 w-3 shrink-0 mx-1" style={{ color: P.text3 }} />}
                      <span className="text-sm font-semibold uppercase tracking-[0.14em]" style={{ color: P.text3 }}>{t}</span>
                    </span>
                  ))}
                </div>
              </nav>
            </FadeUp>
          )}

          {/* Bio */}
          {user.bio && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("bio")} kicker="About" title="In their own words" />
                <p className="text-lg md:text-xl leading-relaxed text-foreground max-w-[62ch]">{user.bio}</p>
              </section>
            </FadeUp>
          )}

          {/* Education */}
          {user.education?.length > 0 && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("education")} kicker="Schooling" title="Where they studied" />
                <StaggerList>
                  {user.education.map((e, i) => {
                    const place = [e.state, e.country].filter(Boolean).join(", ");
                    const subtitle = [degreeLabel(e.degree), e.major].filter(Boolean).join(" / ");
                    const meta = [place, e.scholarship ? `${e.scholarship} Scholar` : null].filter(Boolean).join("  /  ");
                    const years = e.start_year || e.end_year ? `${e.start_year ?? "?"} - ${e.end_year ?? "Present"}` : undefined;
                    return (
                      <StaggerItem key={e.id}>
                        <EntryRow index={i} title={e.uni_name} subtitle={subtitle} meta={meta} years={years} />
                      </StaggerItem>
                    );
                  })}
                </StaggerList>
              </section>
            </FadeUp>
          )}

          {/* Career */}
          {user.career?.length > 0 && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("career")} kicker="Work" title="What they do" />
                <StaggerList>
                  {user.career.map((c, i) => {
                    const place = [c.state, c.country].filter(Boolean).join(", ");
                    const subtitle = [c.employer, jobFieldLabel(c.job_field)].filter(Boolean).join(" / ");
                    const years = c.start_year || c.end_year
                      ? `${c.start_year ?? "?"} - ${c.is_current ? "Present" : c.end_year ?? "?"}`
                      : c.is_current ? "Present" : undefined;
                    return (
                      <StaggerItem key={c.id}>
                        <EntryRow
                          index={i}
                          title={c.job_title}
                          subtitle={subtitle}
                          meta={place || undefined}
                          pill={c.is_current ? { label: "Current", color: P.green } : undefined}
                          years={years}
                        />
                      </StaggerItem>
                    );
                  })}
                </StaggerList>
              </section>
            </FadeUp>
          )}

          {/* Contact */}
          {contacts.length > 0 && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("contact")} kicker="Get in touch" title="Connect" />
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

        </div>
      </div>
    </PageEntrance>
  );
}