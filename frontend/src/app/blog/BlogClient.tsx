"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { PenLine, Search, X, Heart, ArrowUpDown, Dot } from "lucide-react";
import { blogApi } from "@/lib/api";
import { keys } from "@/lib/cache/keys";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatDate,
  genLabel,
  cohortColor,
  cohortColorHex,
  cohortColorSoftHex,
  cohortTextColor,
} from "@/lib/utils";
import type { BlogRead } from "@/lib/types";
import { PageEntrance, FadeUp } from "@/components/ui/motion";
import { Lock, MessageSquare } from "lucide-react";

function parseTags(t?: string) {
  return (t ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function AuthorAvatar({ blog, size = 26 }: { blog: BlogRead; size?: number }) {
  const name = `${blog.author.first_name} ${blog.author.last_name}`;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const color = cohortColorHex(blog.author.kvis_year);
  const textColor = cohortTextColor(blog.author.kvis_year);
  return (
    <Avatar
      style={{
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <AvatarImage src={blog.author.profile_pic_url} alt={name} />
      <AvatarFallback
        style={{ background: color, color: textColor, fontSize: size * 0.35 }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

function CardBanner({
  blog,
  height = 240,
}: {
  blog: BlogRead;
  height?: number;
  showAvatar?: boolean;
  avatarSize?: number;
}) {
  const colorHex = cohortColorHex(blog.author.kvis_year);

  return (
    <div
      style={{
        height,
        position: "relative",
        overflow: "hidden",
        background: "var(--kvis-bg)",
        width: "100%",
      }}
    >
      {blog.cover_image_url ? (
        <Image src={blog.cover_image_url} alt={blog.title} fill unoptimized className="object-contain bg-black/5" />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${colorHex}40 0%, ${colorHex}15 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <img
            src="/favicon.png"
            alt=""
            style={{
              width: 64,
              height: 64,
              opacity: 0.3,
              userSelect: "none",
              filter: "grayscale(1)",
              mixBlendMode: "luminosity",
            }}
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}

function FeaturedStory({ blog }: { blog: BlogRead }) {
  const tags = parseTags(blog.tags);
  const color = cohortColor(blog.author.kvis_year);
  const badge = blog.author.kvis_year ? genLabel(blog.author.kvis_year) : null;

  return (
    <Link href={`/blog/${blog.slug}`} className="group block">
      <div className="overflow-hidden border border-[var(--kvis-border)] transition-colors duration-200 group-hover:border-[var(--kvis-border)]">
        <div className="grid md:grid-cols-2 min-h-[240px]">
          <CardBanner blog={blog} height={240} showAvatar avatarSize={48} />
          <div className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-sm flex-wrap">
                {badge && (
                  <span
                    className="text-xs font-bold uppercase tracking-[0.14em] py-0.5 rounded-full"
                    style={{ color }}
                  >
                    {badge}
                  </span>
                )}
                {tags[0] && (
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--kvis-text3)]">
                    {tags[0]}
                  </span>
                )}
                {blog.visibility === "kvis_only" && (
                  <span className="flex items-center gap-1 text-xs font-medium text-[var(--kvis-green-light)] opacity-70">
                    <Lock className="h-3 w-3" />
                    KVIS Only
                  </span>
                )}
              </div>
              <h2
                className="text-xl font-bold leading-[1.2] tracking-[-0.01em] text-foreground mb-2 line-clamp-3 group-hover:underline decoration-2 underline-offset-[4px] break-words"
                style={{ textDecorationColor: color }}
              >
                {blog.title}
              </h2>
              {blog.excerpt && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 break-words">
                  {blog.excerpt}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 mt-md pt-md border-t border-[var(--kvis-border)]">
              <AuthorAvatar blog={blog} size={28} />
              <span className="text-xs font-semibold text-foreground">
                {blog.author.first_name} {blog.author.last_name}
              </span>
              <Dot className="h-3 w-3 text-[var(--kvis-text3)] shrink-0" />
              <span className="text-xs text-[var(--kvis-text3)]">
                {blog.published_at ? formatDate(blog.published_at) : "Draft"}
              </span>
              {(blog.likes ?? 0) > 0 && (
                <span className="ml-auto flex items-center gap-1 text-xs text-[var(--kvis-text3)]">
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

function StoryRow({ blog, index }: { blog: BlogRead; index: number }) {
  const tags = parseTags(blog.tags);
  const color = cohortColor(blog.author.kvis_year);
  const badge = blog.author.kvis_year ? genLabel(blog.author.kvis_year) : null;

  return (
    <Link href={`/blog/${blog.slug}`} className="group block">
      <div className="py-4 flex items-start gap-4 border-b border-[var(--kvis-border)]">
        <span className="text-xs tabular-nums font-bold text-[var(--kvis-text3)] w-5 shrink-0 mt-0.5">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-bold text-foreground leading-snug line-clamp-1 group-hover:underline decoration-2 underline-offset-[4px] break-words"
            style={{ textDecorationColor: color }}
          >
            {blog.title}
          </h3>
          {blog.excerpt && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-0.5 break-words">
              {blog.excerpt}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-[var(--kvis-text3)]">
              {blog.author.first_name} {blog.author.last_name}
            </span>
            {badge && (
              <span className="text-xs font-bold" style={{ color }}>
                {badge}
              </span>
            )}
            {tags[0] && (
              <span className="text-xs text-[var(--kvis-text3)]">
                #{tags[0]}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 mt-0.5">
          {blog.visibility === "kvis_only" && (
            <Lock className="h-3 w-3 text-[var(--kvis-green-light)] opacity-60" />
          )}
          {(blog.likes ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-xs text-[var(--kvis-text3)]">
              <Heart className="h-3 w-3" /> {blog.likes}
            </span>
          )}
          {(blog.comment_count ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-xs text-[var(--kvis-text3)]">
              <MessageSquare className="h-3 w-3" /> {blog.comment_count}
            </span>
          )}
          <span className="text-xs tabular-nums text-[var(--kvis-text3)]">
            {blog.published_at ? formatDate(blog.published_at) : "Draft"}
          </span>
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

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQ), 400);
    return () => clearTimeout(t);
  }, [searchQ]);

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: keys.blog.list({ limit: 100, search: debouncedSearch || undefined }),
    queryFn: () => blogApi.list({ limit: 100, search: debouncedSearch || undefined }),
    staleTime: 0,
  });

  const { data: drafts = [] } = useQuery({
    queryKey: ["blogs", "my-drafts"],
    queryFn: () => blogApi.myDrafts(),
    enabled: !!user,
  });

  const allTags = useMemo(() => {
    const m = new Map<string, number>();
    blogs.forEach((b) =>
      parseTags(b.tags).forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)),
    );
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [blogs]);

  const filtered = useMemo(() => {
    let result = activeTag
      ? blogs.filter((b) => parseTags(b.tags).includes(activeTag))
      : blogs;
    return [...result].sort((a, b) => {
      if (sortBy === "popular") return (b.likes ?? 0) - (a.likes ?? 0);
      if (sortBy === "oldest")
        return (
          new Date(a.published_at ?? a.created_at ?? 0).getTime() -
          new Date(b.published_at ?? b.created_at ?? 0).getTime()
        );
      return (
        new Date(b.published_at ?? b.created_at ?? 0).getTime() -
        new Date(a.published_at ?? a.created_at ?? 0).getTime()
      );
    });
  }, [activeTag, sortBy, blogs]);

  const [featured, ...rest] = filtered;
  const now = new Date();

  return (
    <PageEntrance className="min-h-full overflow-hidden">
      <div className="min-h-full bg-background">
        <div className="mx-auto flex min-h-full max-w-5xl flex-col px-4 md:px-6 py-xl lg:py-layout">
          <FadeUp>
            <header className="pb-xl border-b border-[var(--sep-strong)]">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] mb-sm text-[var(--kvis-green-light)] flex items-center">
                    KVIS Connect <Dot className="h-6 w-6 shrink-0" aria-hidden /> Stories
                  </p>
                  <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95]">
                    <span className="font-light text-foreground">
                      Share your{" "}
                    </span>
                    <span style={{ color: "var(--kvis-purple)" }}>Stories</span>
                  </h1>
                  <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                    Essays, discussions, updates, debates, and reflections from
                    KVIS alumni - at home and abroad.
                  </p>
                </div>
                {user && (
                  <Button
                    asChild
                    className="shrink-0 rounded-none bg-foreground text-background hover:bg-foreground/90"
                  >
                    <Link href="/blog/new">
                      <PenLine className="h-4 w-4 mr-2" /> Write a post
                    </Link>
                  </Button>
                )}
              </div>

              {/* Tag pills + sort */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTag("")}
                  className="px-3 py-2 rounded-full text-xs font-semibold transition-colors"
                  style={{
                    background: !activeTag ? "var(--kvis-purple)" : "transparent",
                    color: !activeTag ? "white" : "var(--kvis-text3)",
                    border: !activeTag ? "none" : "0.5px solid var(--kvis-border)",
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
                      border: activeTag === t ? "none" : "0.5px solid var(--kvis-border)",
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
              
                {/* Sort — sits at end of the same flex-wrap row */}
                <div className="relative ml-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setSortOpen((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold"
                    style={{ background: "var(--kvis-purple)", color: "white" }}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : "Most liked"}
                  </button>
                  {sortOpen && (
                    <div
                      className="absolute top-full right-0 mt-1 z-50 bg-background border border-[var(--kvis-border)] shadow-lg min-w-[140px]"
                      onMouseLeave={() => setSortOpen(false)}
                    >
                      {[
                        { value: "newest", label: "Newest" },
                        { value: "oldest", label: "Oldest" },
                        { value: "popular", label: "Most liked" },
                      ].map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => { setSortBy(o.value); setSortOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-[var(--kvis-purple-soft)] transition-colors"
                          style={{ color: sortBy === o.value ? "var(--kvis-purple)" : "var(--kvis-text3)" }}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-3 px-3 py-2 mt-4 border border-[var(--kvis-border)] rounded-sm">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search posts by title, tag, or author..."
                  className="flex-1 bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
                {searchQ && (
                  <button onClick={() => setSearchQ("")}>
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 md:gap-4 mt-5 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap text-[var(--kvis-text3)]">
                <span>
                  {now
                    .toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                    .toUpperCase()}
                </span>
                <Dot className="h-3 w-3 text-[var(--kvis-text3)] shrink-0" />
                <span>
                  {blogs.length} {blogs.length === 1 ? "post" : "posts"}
                </span>
              </div>
            </header>
          </FadeUp>

          {isLoading && (
            <div className="pt-xl space-y-8">
              <Skeleton className="h-60 w-full rounded-2xl" />
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden border border-muted"
                  >
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
            <FadeUp className="flex flex-1">
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <p className="text-xs uppercase tracking-[0.28em] font-bold mb-4 text-[var(--kvis-text3)]">
                  Nothing here yet
                </p>
                <p className="text-3xl font-black tracking-tight text-foreground mb-2">
                  {activeTag
                    ? `No posts tagged "${activeTag}"`
                    : searchQ
                      ? `No posts matching "${searchQ}"`
                      : "No posts yet"}
                </p>
                {(activeTag || searchQ) && (
                  <button
                    onClick={() => {
                      setActiveTag("");
                      setSearchQ("");
                    }}
                    className="text-sm underline text-[var(--kvis-purple)]"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </FadeUp>
          )}

          {!isLoading && user && drafts.length > 0 && (
            <FadeUp delay={0.08}>
              <section className="pt-xl">
                <h2 className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)] mb-5 flex items-center gap-2">
                  <span style={{ color: "var(--kvis-purple-light)" }}>My Drafts</span>
                  <span className="tabular-nums">({drafts.length})</span>
                </h2>
                <div className="divide-y divide-[var(--kvis-border)] border-t border-[var(--kvis-border)]">
                  {drafts.map((b, i) => (
                    <StoryRow key={b.id} blog={b} index={i} />
                  ))}
                </div>
              </section>
            </FadeUp>
          )}

          {!isLoading && featured && (
            <FadeUp delay={0.1}>
              <div className="pt-xl">
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
                <div className="divide-y divide-[var(--kvis-border)] border-t border-[var(--kvis-border)]">
                  {rest.map((b, i) => (
                    <StoryRow key={b.id} blog={b} index={i} />
                  ))}
                </div>
              </section>
            </FadeUp>
          )}

          {!isLoading && filtered.length > 0 && (
            <footer className="mt-auto pt-6 border-t border-[var(--sep-strong)] text-muted-foreground text-xs uppercase tracking-[0.22em] flex items-center justify-between">
              <span>- end -</span>
              <span className="tabular-nums flex items-center">
                KVIS Connect <Dot className="h-3 w-3 shrink-0" aria-hidden /> {now.getFullYear()}
              </span>
            </footer>
          )}
        </div>
      </div>
    </PageEntrance>
  );
}
