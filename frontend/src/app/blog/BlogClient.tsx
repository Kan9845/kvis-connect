"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { PenLine } from "lucide-react";
import { blogApi } from "@/lib/api";
import { keys } from "@/lib/cache/keys";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FilterPill } from "@/components/ui/filter-pill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cohortColor, cohortColorHex, cohortColorSoftHex, cohortTextColor, formatDate, genLabel } from "@/lib/utils";
import type { BlogRead } from "@/lib/types";
import { PageEntrance, FadeUp, StaggerList, StaggerItem } from "@/components/ui/motion";

function parseTags(t?: string) {
  return (t ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}

function Byline({ blog, dense = false }: { blog: BlogRead; dense?: boolean }) {
  const name = `${blog.author.first_name} ${blog.author.last_name}`;
  const color = cohortColor(blog.author.kvis_year);
  const textColor = cohortTextColor(blog.author.kvis_year);
  return (
    <div className={`flex items-center gap-2 ${dense ? "text-xs" : "text-sm"} flex-wrap`}>
      {!dense && (
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={blog.author.profile_pic_url} alt={name} />
          <AvatarFallback
            style={{
              background: `linear-gradient(135deg, ${cohortColorHex(blog.author.kvis_year)} 0%, ${cohortColorSoftHex(blog.author.kvis_year)} 100%)`,
              color: cohortTextColor(blog.author.kvis_year),
              fontSize: 28 * 0.38,
            }}
          >
        </Avatar>
      )}
      <span className="font-semibold text-foreground">{name}</span>
      {blog.author.kvis_year && (
        <>
          <span className="text-[var(--kvis-text3)]">·</span>
          <span className="tabular-nums font-bold" style={{ color }}>{genLabel(blog.author.kvis_year)}</span>
        </>
      )}
      <span className="text-[var(--kvis-text3)]">·</span>
      <span className="text-muted-foreground tabular-nums">
        {blog.published_at ? formatDate(blog.published_at) : "Draft"}
      </span>
    </div>
  );
}

function FeaturedStory({ blog }: { blog: BlogRead }) {
  const tags = parseTags(blog.tags);
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group block py-10 border-b border-[var(--kvis-rule)]"
    >
      <div className="text-xs font-bold uppercase tracking-[0.24em] mb-5 text-[var(--kvis-green)]">
        Featured{tags[0] ? <span className="text-[var(--kvis-text3)]">{`  ·  ${tags[0]}`}</span> : null}
      </div>
      <h2
        className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.02] tracking-[-0.02em] text-foreground mb-5 max-w-[20ch] group-hover:underline decoration-[3px] underline-offset-[6px] decoration-[var(--kvis-purple)]"
      >
        {blog.title}
      </h2>
      {blog.excerpt && (
        <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-[62ch] mb-6">
          {blog.excerpt}
        </p>
      )}
      {blog.cover_image_url && (
        <div className="relative aspect-[16/9] md:aspect-[16/7] overflow-hidden bg-muted mb-6">
          <Image
            src={blog.cover_image_url}
            alt={blog.title}
            fill
            priority
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      )}
      <Byline blog={blog} />
    </Link>
  );
}

function StoryRow({ blog, index }: { blog: BlogRead; index: number }) {
  const tags = parseTags(blog.tags);
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group grid grid-cols-[1.75rem_1fr_auto] gap-x-5 md:gap-x-8 gap-y-3 py-7 border-b border-[var(--kvis-rule)] items-start"
    >
      <span className="text-xs font-mono font-semibold tabular-nums pt-1.5 text-[var(--kvis-text3)]">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        {tags[0] && (
          <div className="text-xs font-bold uppercase tracking-[0.22em] mb-2 text-[var(--kvis-purple)]">
            {tags[0]}
          </div>
        )}
        <h3
          className="text-xl md:text-2xl font-bold leading-[1.15] tracking-[-0.01em] text-foreground mb-2 group-hover:underline decoration-2 underline-offset-[5px] decoration-[var(--kvis-purple)]"
        >
          {blog.title}
        </h3>
        {blog.excerpt && (
          <p className="text-sm md:text-[15px] leading-relaxed text-muted-foreground line-clamp-2 mb-3 max-w-[68ch]">
            {blog.excerpt}
          </p>
        )}
        <Byline blog={blog} dense />
      </div>
      {blog.cover_image_url ? (
        <div className="relative w-24 h-20 md:w-40 md:h-28 shrink-0 overflow-hidden bg-muted">
          <Image
            src={blog.cover_image_url}
            alt=""
            fill
            sizes="(min-width: 768px) 160px, 96px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
      ) : (
        <div className="hidden md:block w-40 h-28 shrink-0 bg-[repeating-linear-gradient(135deg,var(--kvis-purple-soft)_0_8px,transparent_8px_16px)]" />
      )}
    </Link>
  );
}

export default function BlogClient() {
  const { user } = useAuth();
  const [activeTag, setActiveTag] = useState<string>("");

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
    if (!activeTag) return blogs;
    return blogs.filter((b) => parseTags(b.tags).includes(activeTag));
  }, [activeTag, blogs]);

  const [featured, ...rest] = filtered;

  const now = new Date();
  const issueLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();

  return (
    <PageEntrance>
      <div className="min-h-full bg-background">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-10 lg:py-14">
          {/* Masthead */}
          <FadeUp>
            <header className="pb-7 border-b border-foreground/60">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 text-[var(--kvis-purple)]">
                    KVIS Connect · Stories
                  </p>
                  <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95] text-foreground">
                    Stories
                  </h1>
                  <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-[55ch] leading-relaxed">
                    Essays, updates, and reflections from KVIS alumni - at home and abroad.
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
              <div className="flex items-center gap-3 md:gap-4 mt-6 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap text-[var(--kvis-text3)]">
                <span>{issueLabel}</span>
                <span aria-hidden>·</span>
                <span>
                  {blogs.length} {blogs.length === 1 ? "post" : "posts"}
                </span>
              </div>
            </header>
          </FadeUp>

          {/* Sections / tag rail */}
          {allTags.length > 0 && (
            <FadeUp delay={0.1}>
              <nav className="grid grid-cols-[72px_1fr] md:grid-cols-[100px_1fr] items-baseline gap-x-5 gap-y-2 py-4 border-b border-[var(--kvis-rule)]">
                <span className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)]">
                  Tags
                </span>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-2.5">
                  {[{ name: "All", count: blogs.length, key: "" } as { name: string; count: number; key: string }]
                    .concat(allTags.map(([t, c]) => ({ name: t, count: c, key: t })))
                    .map(({ name, count, key }) => {
                      const active = activeTag === key;
                      return (
                        <FilterPill
                          key={key || "all"}
                          active={active}
                          count={count}
                          onClick={() => setActiveTag(active ? "" : key)}
                        >
                          {name}
                        </FilterPill>
                      );
                    })}
                </div>
              </nav>
            </FadeUp>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="pt-10 space-y-8">
              <div className="space-y-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="aspect-[16/7] w-full" />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[1.75rem_1fr_10rem] gap-6">
                  <Skeleton className="h-4 w-6" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <Skeleton className="w-40 h-28" />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && filtered.length === 0 && (
            <FadeUp>
              <div className="py-24 text-center">
                <p className="text-xs uppercase tracking-[0.28em] font-bold mb-4 text-[var(--kvis-text3)]">
                  Nothing here yet
                </p>
                <p className="text-3xl font-black tracking-tight text-foreground mb-2">
                  {activeTag ? `No posts tagged "${activeTag}"` : "No posts yet"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeTag ? (
                    <button onClick={() => setActiveTag("")} className="underline text-[var(--kvis-purple)]">
                      See all posts
                    </button>
                  ) : user ? (
                    "Be the first to share something."
                  ) : (
                    "Check back soon."
                  )}
                </p>
              </div>
            </FadeUp>
          )}

          {/* Featured */}
          {!isLoading && featured && (
            <FadeUp delay={0.1}>
              <FeaturedStory blog={featured} />
            </FadeUp>
          )}

          {/* The rest */}
          {!isLoading && rest.length > 0 && (
            <FadeUp delay={0.15}>
              <section>
                <h2 className="pt-10 pb-4 text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)]">
                  More posts
                </h2>
                <StaggerList>
                  {rest.map((b, i) => (
                    <StaggerItem key={b.id}>
                      <StoryRow blog={b} index={i} />
                    </StaggerItem>
                  ))}
                </StaggerList>
              </section>
            </FadeUp>
          )}

          {!isLoading && filtered.length > 0 && (
            <FadeUp>
              <footer className="mt-16 pt-6 border-t border-foreground/60 text-muted-foreground text-xs uppercase tracking-[0.22em] flex items-center justify-between">
                <span>- end -</span>
                <span className="tabular-nums">
                  KVIS Connect · {now.getFullYear()}
                </span>
              </footer>
            </FadeUp>
          )}
        </div>
      </div>
    </PageEntrance>
  );
}
