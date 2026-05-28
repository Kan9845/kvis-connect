"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PenLine, Search, X, ChevronDown, Heart, ArrowUpDown } from "lucide-react";
import { blogApi } from "@/lib/api";
import { keys } from "@/lib/cache/keys";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, genLabel, cohortColor, cohortColorHex, cohortColorSoftHex, cohortTextColor } from "@/lib/utils";
import type { BlogRead } from "@/lib/types";
import { PageEntrance, FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";

function parseTags(t?: string) {
  return (t ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}

function AuthorAvatar({ blog, size = 26 }: { blog: BlogRead; size?: number }) {
  const name = `${blog.author.first_name} ${blog.author.last_name}`;
  const initials = name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const color = cohortColorHex(blog.author.kvis_year);
  const colorSoft = cohortColorSoftHex(blog.author.kvis_year);
  const textColor = cohortTextColor(blog.author.kvis_year);
  const ringColor = cohortColor(blog.author.kvis_year);
  return (
    <Avatar style={{ width: size, height: size, outline: `2px solid ${ringColor}`, outlineOffset: "1px", flexShrink: 0 }}>
      <AvatarImage src={blog.author.profile_pic_url} alt={name} />
      <AvatarFallback style={{ background: `linear-gradient(135deg, ${color}, ${colorSoft})`, color: textColor, fontSize: size * 0.35 }}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

function DropFilter({ label, active, options, value, onChange }: {
  label: string; active: boolean;
  options: { value: string; label: string }[];
  value: string; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label ?? label;
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors"
        style={{
          background: active ? "var(--kvis-purple)" : "transparent",
          color: active ? "white" : "var(--kvis-text3)",
          border: active ? "none" : "0.5px solid var(--kvis-rule)",
        }}>
        {active ? selectedLabel : label}
        {active ? <ChevronDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-background border border-[var(--kvis-rule)] shadow-lg min-w-[140px]"
          onMouseLeave={() => setOpen(false)}>
          {options.map(o => (
            <button key={o.value} type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-[var(--kvis-purple-soft)] transition-colors"
              style={{ color: value === o.value ? "var(--kvis-purple)" : "var(--kvis-text3)" }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StripeBackground({ blog, height = 120, showAvatar = false, avatarSize = 40 }: {
  blog: BlogRead; height?: number; showAvatar?: boolean; avatarSize?: number;
}) {
  const color = cohortColorHex(blog.author.kvis_year);
  const name = `${blog.author.first_name} ${blog.author.last_name}`;
  const initials = name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const colorSoft = cohortColorSoftHex(blog.author.kvis_year);
  const textColor = cohortTextColor(blog.author.kvis_year);
  const ringColor = cohortColor(blog.author.kvis_year);

  return (
    <div style={{
      height, position: "relative", overflow: "hidden",
      backgroundImage: `repeating-linear-gradient(135deg, ${color} 0, ${color} 1px, transparent 0, transparent 50%)`,
      backgroundSize: "8px 8px",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "var(--background)", opacity: 0.82 }} />
      {blog.cover_image_url ? (
        <Image src={blog.cover_image_url} alt={blog.title} fill className="object-cover" style={{ opacity: 0.9 }} />
      ) : showAvatar && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Avatar style={{ width: avatarSize, height: avatarSize, outline: `2.5px solid ${ringColor}`, outlineOffset: "2px" }}>
            <AvatarImage src={blog.author.profile_pic_url} alt={name} />
            <AvatarFallback style={{ background: `linear-gradient(135deg, ${color}, ${colorSoft})`, color: textColor, fontSize: avatarSize * 0.35 }}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
}

function FeaturedStory({ blog }: { blog: BlogRead }) {
  const tags = parseTags(blog.tags);
  const color = cohortColor(blog.author.kvis_year);
  const colorHex = cohortColorHex(blog.author.kvis_year);
  const badge = blog.author.kvis_year ? genLabel(blog.author.kvis_year) : null;

  return (
    <Link href={`/blog/${blog.slug}`} className="group block">
      <div className="rounded-2xl overflow-hidden border border-[var(--kvis-rule)] transition-all duration-300 group-hover:border-transparent group-hover:shadow-lg"
        style={{ background: "var(--kvis-bg)" }}>
        <div className="grid md:grid-cols-2 min-h-[240px]">
          <StripeBackground blog={blog} height={240} showAvatar avatarSize={48} />
          <div className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {badge && (
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full"
                    style={{ background: `${colorHex}22`, color }}>
                    {badge}
                  </span>
                )}
                {tags[0] && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--kvis-text3)]">
                    {tags[0]}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold leading-[1.2] tracking-[-0.01em] text-foreground mb-2 line-clamp-3 group-hover:underline decoration-2 underline-offset-[4px]"
                style={{ textDecorationColor: color }}>
                {blog.title}
              </h2>
              {blog.excerpt && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{blog.excerpt}</p>
              )}
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--kvis-rule)]">
              <AuthorAvatar blog={blog} size={26} />
              <span className="text-xs font-semibold text-foreground">{blog.author.first_name} {blog.author.last_name}</span>
              <span className="text-[11px] text-[var(--kvis-text3)]">
                · {blog.published_at ? formatDate(blog.published_at) : "Draft"}
              </span>
              {(blog.likes ?? 0) > 0 && (
                <span className="ml-auto flex items-center gap-1 text-[10px] text-[var(--kvis-text3)]">
                  <Heart className="h-3 w-3" /> {blog.likes}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function StoryCard({ blog }: { blog: BlogRead }) {
  const tags = parseTags(blog.tags);
  const color = cohortColor(blog.author.kvis_year);
  const colorHex = cohortColorHex(blog.author.kvis_year);
  const badge = blog.author.kvis_year ? genLabel(blog.author.kvis_year) : null;

  return (
    <Link href={`/blog/${blog.slug}`} className="group block h-full">
      <div className="rounded-2xl overflow-hidden border border-[var(--kvis-rule)] transition-all duration-300 group-hover:border-transparent group-hover:shadow-lg h-full flex flex-col"
        style={{ background: "var(--kvis-bg)" }}>
        <StripeBackground blog={blog} height={100} showAvatar avatarSize={36} />
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            {badge && (
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
                style={{ background: `${colorHex}22`, color }}>
                {badge}
              </span>
            )}
            {tags[0] && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--kvis-text3)]">
                {tags[0]}
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold leading-[1.25] text-foreground mb-2 line-clamp-2 group-hover:underline decoration-2 underline-offset-[3px]"
            style={{ textDecorationColor: color }}>
            {blog.title}
          </h3>
          {blog.excerpt && (
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-3 flex-1">
              {blog.excerpt}
            </p>
          )}
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--kvis-rule)] mt-auto">
            <AuthorAvatar blog={blog} size={20} />
            <span className="text-[11px] font-semibold text-foreground truncate">{blog.author.first_name} {blog.author.last_name}</span>
            <span className="text-[10px] text-[var(--kvis-text3)] shrink-0">
              {blog.published_at ? formatDate(blog.published_at) : "Draft"}
            </span>
            {(blog.likes ?? 0) > 0 && (
              <span className="ml-auto flex items-center gap-1 text-[10px] text-[var(--kvis-text3)]">
                <Heart className="h-3 w-3" /> {blog.likes}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function BlogClient() {
  const { user } = useAuth();
  const [activeTag, setActiveTag] = useState<string>("");
  const [searchQ, setSearchQ] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [sortOpen, setSortOpen] = useState(false);

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: keys.blog.list({ limit: 100 }),
    queryFn: () => blogApi.list({ limit: 100 }),
  });

  const allTags = useMemo(() => {
    const m = new Map<string, number>();
    blogs.forEach((b) => parseTags(b.tags).forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [blogs]);

  const filtered = useMemo(() => {
    let result = activeTag ? blogs.filter(b => parseTags(b.tags).includes(activeTag)) : blogs;
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        parseTags(b.tags).some(t => t.toLowerCase().includes(q)) ||
        `${b.author.first_name} ${b.author.last_name}`.toLowerCase().includes(q) ||
        b.excerpt?.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      if (sortBy === "popular") return (b.likes ?? 0) - (a.likes ?? 0);
      if (sortBy === "oldest") return new Date(a.published_at ?? a.created_at ?? 0).getTime() - new Date(b.published_at ?? b.created_at ?? 0).getTime();
      return new Date(b.published_at ?? b.created_at ?? 0).getTime() - new Date(a.published_at ?? a.created_at ?? 0).getTime();
    });
  }, [activeTag, searchQ, sortBy, blogs]);

  const [featured, ...rest] = filtered;
  const now = new Date();

  return (
    <PageEntrance>
      <div className="min-h-full bg-background">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-10 lg:py-14">

          <FadeUp>
            <header className="pb-7 border-b border-foreground/60">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 text-[var(--kvis-green-light)]">
                    KVIS Connect · Stories
                  </p>
                  <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95]">
                    <span className="font-light text-foreground">Share your </span>
                    <span style={{ color: "var(--kvis-purple)" }}>Stories.</span>
                  </h1>
                  <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-[55ch] leading-relaxed">
                    Essays, discussions, updates, debates, and reflections from KVIS alumni — at home and abroad.
                  </p>
                </div>
                {user && (
                  <Button asChild className="shrink-0 rounded-none bg-foreground text-background hover:bg-foreground/90">
                    <Link href="/blog/new">
                      <PenLine className="h-4 w-4 mr-2" /> Write a post
                    </Link>
                  </Button>
                )}
              </div>

              {/* Tag pills + sort */}
              <div className="flex items-center justify-between gap-4 mt-5">
                {/* Popular tags — top 5 only */}
                <div className="flex items-center flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTag("")}
                    className="px-3 py-2 rounded-full text-xs font-semibold transition-colors"
                    style={{
                      background: !activeTag ? "var(--kvis-purple)" : "transparent",
                      color: !activeTag ? "white" : "var(--kvis-text3)",
                      border: !activeTag ? "none" : "0.5px solid var(--kvis-rule)",
                    }}
                  >
                    All
                  </button>
                  {allTags.slice(0, 5).map(([t]) => (
                    <button
                      key={t}
                      onClick={() => setActiveTag(activeTag === t ? "" : t)}
                      className="px-3 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-1"
                      style={{
                        background: activeTag === t ? "var(--kvis-purple)" : "transparent",
                        color: activeTag === t ? "white" : "var(--kvis-text3)",
                        border: activeTag === t ? "none" : "0.5px solid var(--kvis-rule)",
                      }}
                    >
                      <span
                        className="font-normal text-sm leading-none"
                        style={{ color: activeTag === t ? "rgba(255,255,255,0.7)" : "var(--kvis-purple)" }}
                      >
                        #
                      </span>
                      {t}
                    </button>
                  ))}
                </div>
                
                {/* Sort — always purple, right side */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setSortOpen(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold"
                    style={{ background: "var(--kvis-purple)", color: "white" }}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : "Most liked"}
                  </button>
                  {sortOpen && (
                    <div
                      className="absolute top-full right-0 mt-1 z-50 bg-background border border-[var(--kvis-rule)] shadow-lg min-w-[140px]"
                      onMouseLeave={() => setSortOpen(false)}
                    >
                      {[
                        { value: "newest", label: "Newest" },
                        { value: "oldest", label: "Oldest" },
                        { value: "popular", label: "Most liked" },
                      ].map(o => (
                        <button key={o.value} type="button"
                          onClick={() => { setSortBy(o.value); setSortOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-[var(--kvis-purple-soft)] transition-colors"
                          style={{ color: sortBy === o.value ? "var(--kvis-purple)" : "var(--kvis-text3)" }}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-3 px-3 py-2 mt-4 border border-[var(--kvis-rule)] rounded-sm">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search posts by title, tag, or author..."
                  className="flex-1 bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
                {searchQ && <button onClick={() => setSearchQ("")}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
              </div>

              <div className="flex items-center gap-3 md:gap-4 mt-5 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap text-[var(--kvis-text3)]">
                <span>{now.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()}</span>
                <span aria-hidden>·</span>
                <span>{blogs.length} {blogs.length === 1 ? "post" : "posts"}</span>
              </div>
            </header>
          </FadeUp>

          {isLoading && (
            <div className="pt-10 space-y-8">
              <Skeleton className="h-60 w-full rounded-2xl" />
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-[var(--kvis-rule)]">
                    <Skeleton className="h-24 w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <FadeUp>
              <div className="py-24 text-center">
                <p className="text-xs uppercase tracking-[0.28em] font-bold mb-4 text-[var(--kvis-text3)]">Nothing here yet</p>
                <p className="text-3xl font-black tracking-tight text-foreground mb-2">
                  {activeTag ? `No posts tagged "${activeTag}"` : searchQ ? `No posts matching "${searchQ}"` : "No posts yet"}
                </p>
                {(activeTag || searchQ) && (
                  <button onClick={() => { setActiveTag(""); setSearchQ(""); }} className="text-sm underline text-[var(--kvis-purple)]">
                    Clear filters
                  </button>
                )}
              </div>
            </FadeUp>
          )}

          {!isLoading && featured && (
            <FadeUp delay={0.1}>
              <div className="pt-8">
                <FeaturedStory blog={featured} />
              </div>
            </FadeUp>
          )}

          {!isLoading && rest.length > 0 && (
            <FadeUp delay={0.15}>
              <section className="pt-8">
                <h2 className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)] mb-5">
                  More posts
                </h2>
                <StaggerList>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-stretch">
                    {rest.map((b) => (
                      <StaggerItem key={b.id} className="h-full">
                        <StoryCard blog={b} />
                      </StaggerItem>
                    ))}
                  </div>
                </StaggerList>
              </section>
            </FadeUp>
          )}

          {!isLoading && filtered.length > 0 && (
            <FadeUp>
              <footer className="mt-16 pt-6 border-t border-foreground/60 text-muted-foreground text-xs uppercase tracking-[0.22em] flex items-center justify-between">
                <span>- end -</span>
                <span className="tabular-nums">KVIS Connect · {now.getFullYear()}</span>
              </footer>
            </FadeUp>
          )}

        </div>
      </div>
    </PageEntrance>
  );
}