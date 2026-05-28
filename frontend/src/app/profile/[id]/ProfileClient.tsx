"use client";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Dot, ShieldCheck } from "lucide-react";
import { userApi, blogApi } from "@/lib/api";
import { keys } from "@/lib/cache/keys";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { degreeLabel, jobFieldLabel } from "@/lib/constants/options";
import { cohortColor, cohortTextColor, cohortColorHex, cohortColorSoftHex, formatDate, genLabel } from "@/lib/utils";
import { PageEntrance, FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";
import type { BlogRead } from "@/lib/types";

function parseInterests(t?: string) {
  return (t ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}

function hostname(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

function parseTags(t?: string) {
  return (t ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}

function SectionHead({ numeral, kicker }: { numeral: string; kicker: string }) {
  return (
    <header className="pt-9 pb-4">
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

function EntryRow({ index, title, subtitle, meta, pill, years }: {
  index: number; title: string; subtitle?: string;
  meta?: string; pill?: { label: string; color: string }; years?: string;
}) {
  return (
    <div className="grid items-baseline py-6 border-b border-[var(--kvis-rule)]"
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
            <Badge className="rounded-none border-transparent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em] leading-none text-white"
              style={{ background: pill.color }}>
              {pill.label}
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-sm md:text-[15px] text-muted-foreground mt-1.5 leading-snug">{subtitle}</p>}
        {meta && <p className="text-xs uppercase tracking-[0.22em] mt-2 tabular-nums text-[var(--kvis-text3)]">{meta}</p>}
      </div>
      <span className="text-sm font-mono tabular-nums text-right whitespace-nowrap text-[var(--kvis-text3)]">
        {years ?? "-"}
      </span>
    </div>
  );
}

function ContactRow({ label, display, href }: { label: string; display: string; href: string }) {
  const external = /^https?:/.test(href);
  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}
      className="group grid items-center py-4 border-b border-[var(--kvis-rule)]"
      style={{ gridTemplateColumns: "100px minmax(0, 1fr) auto", columnGap: "1.25rem" }}>
      <span className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)]">{label}</span>
      <span className="text-sm md:text-base text-foreground truncate group-hover:underline decoration-2 underline-offset-[5px] decoration-[var(--kvis-purple)]">
        {display}
      </span>
      <ExternalLink className="h-4 w-4 text-[var(--kvis-text3)]" />
    </a>
  );
}

function StoryCard({ blog, ringColor }: { blog: BlogRead; ringColor: string }) {
  const tags = parseTags(blog.tags);

  return (
    <Link href={`/blog/${blog.slug}`} className="group block h-full">
      <div className="rounded-2xl overflow-hidden border border-[var(--kvis-rule)] transition-all duration-300 group-hover:border-transparent group-hover:shadow-lg h-full flex flex-col"
        style={{ background: "var(--kvis-bg)" }}>

        {/* Cover image or stripe */}
        <div className="relative w-full aspect-[4/3] overflow-hidden flex-shrink-0">
          {blog.cover_image_url ? (
            <Image
              src={blog.cover_image_url}
              alt={blog.title}
              fill
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `repeating-linear-gradient(135deg, ${cohortColorHex(blog.author.kvis_year)} 0, ${cohortColorHex(blog.author.kvis_year)} 1px, transparent 0, transparent 50%)`,
              backgroundSize: "8px 8px",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "var(--background)", opacity: 0.82 }} />
            </div>
          )}
        </div>

        {/* Text below */}
        <div className="p-3 flex flex-col flex-1">
          {tags[0] && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--kvis-text3)] mb-1">
              {tags[0]}
            </p>
          )}
          <h3 className="text-sm font-bold leading-[1.25] text-foreground line-clamp-2 group-hover:underline decoration-2 underline-offset-[3px]"
            style={{ textDecorationColor: ringColor }}>
            {blog.title}
          </h3>
          <p className="text-[10px] text-[var(--kvis-text3)] mt-auto pt-2 font-mono">
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
    b => b.author.id === user?.id || `${b.author.first_name} ${b.author.last_name}` === `${user?.first_name} ${user?.last_name}`
  );

  if (isLoading) {
    return (
      <PageEntrance>
        <div className="min-h-full bg-background">
          <div className="mx-auto max-w-5xl px-6 lg:px-10 py-10 lg:py-14">
            <Skeleton className="h-4 w-48 mb-4" />
            <div className="grid grid-cols-[140px_1fr] md:grid-cols-[200px_1fr] gap-6 md:gap-10 pb-7 border-b border-foreground/40">
              <Skeleton className="aspect-square w-full rounded-full" />
              <div className="space-y-4">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
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
          <div className="mx-auto max-w-5xl px-6 lg:px-10 py-24 text-center">
            <p className="text-xs uppercase tracking-[0.28em] font-bold mb-4 text-[var(--kvis-text3)]">404</p>
            <p className="text-4xl font-black tracking-tight text-foreground mb-3">Profile not found</p>
            <p className="text-sm text-muted-foreground">
              <Link href="/kvisian" className="underline text-[var(--kvis-purple)]">Browse the directory</Link>
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
  const ringColor = cohortColor(user.kvis_year);

  const contacts: { label: string; display: string; href: string }[] = [];
  if (user.linkedin_url) contacts.push({ label: "LinkedIn", display: hostname(user.linkedin_url), href: user.linkedin_url });
  if (user.facebook_url) contacts.push({ label: "Facebook", display: hostname(user.facebook_url), href: user.facebook_url });
  if (user.website_url) contacts.push({ label: "Website", display: hostname(user.website_url), href: user.website_url });

  const sections: { key: string; label: string; title: string }[] = [];
  if (user.bio) sections.push({ key: "bio", label: "About", title: "In their own words" });
  if (user.education?.length) sections.push({ key: "education", label: "Schooling", title: "Where they studied" });
  if (user.career?.length) sections.push({ key: "career", label: "Work", title: "What they do" });
  if (contacts.length) sections.push({ key: "contact", label: "Get in touch", title: "Connect" });
  if (userBlogs.length) sections.push({ key: "posts", label: "Writing", title: "Their posts" });

  const numeralFor = (key: string) => {
    const idx = sections.findIndex((s) => s.key === key);
    return ["I.", "II.", "III.", "IV.", "V.", "VI."][idx] ?? "-";
  };

  return (
    <PageEntrance>
      <div className="min-h-full bg-background">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-10 lg:py-14">

          <FadeUp>
            <header className="pb-8 border-b border-foreground/60">
              {/* Full bleed hero card */}
              <div
                className="relative overflow-hidden rounded-2xl mb-6"
                style={{ minHeight: 220, background: cohortColor(user.kvis_year) }}
              >
                {/* Stripe */}
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: `repeating-linear-gradient(135deg, white 0, white 1px, transparent 0, transparent 50%)`,
                  backgroundSize: "6px 6px",
                  opacity: 0.1,
                }} />
                {/* Dark gradient overlay */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 100%)",
                }} />
          
                {/* Content */}
                <div className="relative flex items-end justify-between p-7 md:p-10" style={{ minHeight: 220 }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
                        KVIS Connect · Alumni
                      </p>
                      {user.kvis_year && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
                          {genLabel(user.kvis_year)}
                        </span>
                      )}
                      {user.is_verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </div>
                    
                    <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.035em] leading-[0.9] text-white mb-3">
                      {user.first_name}<br />{user.last_name}
                    </h1>
                    
                    {currentRole && (
                      <p className="text-sm text-white/75 mb-4">
                        {currentRole.job_title}
                        {currentRole.employer && ` @ ${currentRole.employer}`}
                        {user.place && ` · ${user.place}`}
                      </p>
                    )}
          
                    {/* Tags / interests */}
                    {interests.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {user.mbti && (
                          <span className="text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full"
                            style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
                            {user.mbti}
                          </span>
                        )}
                        {interests.slice(0, 4).map(t => (
                          <span key={t} className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full"
                            style={{ background: "rgba(255,255,255,0.12)", color: "white" }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Avatar */}
                  <div className="shrink-0 ml-6">
                    <div
                      className="relative overflow-hidden rounded-full"
                      style={{
                        width: 88, height: 88,
                        outline: "3px solid white",
                        outlineOffset: "2px",
                      }}
                    >
                      {user.profile_pic_url ? (
                        <Image src={user.profile_pic_url} alt={`${user.first_name} ${user.last_name}`}
                          fill sizes="88px" className="object-cover" priority />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center font-black text-2xl"
                          style={{
                            background: `linear-gradient(135deg, ${cohortColorHex(user.kvis_year)} 0%, ${cohortColorSoftHex(user.kvis_year)} 100%)`,
                            color: cohortTextColor(user.kvis_year),
                          }}>
                          {initials}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
                    
              {/* Below card — meta + edit button */}
              <div className="flex items-center justify-between flex-wrap gap-4">
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
                  <Button asChild className="h-auto rounded-none bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90">
                    <Link href="/profile/edit">Edit profile</Link>
                  </Button>
                )}
              </div>
            </header>
          </FadeUp>

          {user.bio && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("bio")} kicker="About"/>
                <p className="text-lg md:text-xl leading-relaxed text-foreground max-w-[62ch]">{user.bio}</p>
              </section>
            </FadeUp>
          )}

          {user.education?.length > 0 && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("education")} kicker="Schooling"/>
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

          {user.career?.length > 0 && (
            <FadeUp>
              <section>
                <SectionHead numeral={numeralFor("career")} kicker="Work" />
                <StaggerList>
                  {user.career.map((c, i) => {
                    const place = [c.state, c.country].filter(Boolean).join(", ");
                    const subtitle = [c.employer, jobFieldLabel(c.job_field)].filter(Boolean).join(" / ");
                    const years = c.start_year || c.end_year
                      ? `${c.start_year ?? "?"} - ${c.is_current ? "Present" : c.end_year ?? "?"}`
                      : c.is_current ? "Present" : undefined;
                    return (
                      <StaggerItem key={c.id}>
                        <EntryRow index={i} title={c.job_title} subtitle={subtitle}
                          meta={place || undefined}
                          pill={c.is_current ? { label: "Current", color: "var(--kvis-green-light)" } : undefined}
                          years={years} />
                      </StaggerItem>
                    );
                  })}
                </StaggerList>
              </section>
            </FadeUp>
          )}

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

          {/* Blog posts */}
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

          <FadeUp>
            <footer className="mt-20 pt-6 border-t border-foreground/60 text-muted-foreground text-xs uppercase tracking-[0.22em] flex items-center justify-between">
              <span>- end -</span>
              <span className="tabular-nums">KVIS Connect · {new Date().getFullYear()}</span>
            </footer>
          </FadeUp>

        </div>
      </div>
    </PageEntrance>
  );
}