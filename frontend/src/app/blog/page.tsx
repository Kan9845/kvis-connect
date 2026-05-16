"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { PenLine } from "lucide-react";
import { blogApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, genLabel } from "@/lib/utils";
import type { BlogRead } from "@/lib/types";

const P = {
  purple: "oklch(44% 0.26 294)",
  purpleSoft: "oklch(95% 0.035 294)",
  green: "oklch(40% 0.16 148)",
  ink: "oklch(20% 0.015 294)",
  text2: "oklch(45% 0.008 294)",
  text3: "oklch(62% 0.005 294)",
  rule: "oklch(90% 0.007 294)",
};

function parseTags(t?: string) {
  return (t ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}

function Avatar({ name, src, size = 32 }: { name: string; src?: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size, background: P.purple, fontSize: size * 0.38 }}
    >
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : initials}
    </div>
  );
}

function Byline({ blog, dense = false }: { blog: BlogRead; dense?: boolean }) {
  const name = `${blog.author.first_name} ${blog.author.last_name}`;
  return (
    <div className={`flex items-center gap-2 ${dense ? "text-xs" : "text-sm"} flex-wrap`}>
      {!dense && <Avatar name={name} src={blog.author.profile_pic_url} size={28} />}
      <span className="font-semibold text-foreground">{name}</span>
      {blog.author.kvis_year && (
        <>
          <span style={{ color: P.text3 }}>·</span>
          <span className="text-muted-foreground tabular-nums">{genLabel(blog.author.kvis_year)}</span>
        </>
      )}
      <span style={{ color: P.text3 }}>·</span>
      <span className="text-muted-foreground tabular-nums">
        {blog.published_at ? formatDate(blog.published_at) : "Draft"}
      </span>
    </div>
  );
}

function FeaturedStory({ blog }: { blog: BlogRead }) {
  const tags = parseTags(blog.tags);
  return (
    <Link href={`/blog/${blog.slug}`} className="group block py-10 border-b" style={{ borderColor: P.rule }}>
      <div className="text-xs font-bold uppercase tracking-[0.24em] mb-5" style={{ color: P.green }}>
        Featured{tags[0] ? <span style={{ color: P.text3 }}>{`  ·  ${tags[0]}`}</span> : null}
      </div>
      <h2
        className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.02] tracking-[-0.02em] text-foreground mb-5 max-w-[20ch] group-hover:underline decoration-[3px] underline-offset-[6px]"
        style={{ textDecorationColor: P.purple }}
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
      className="group grid grid-cols-[1.75rem_1fr_auto] gap-x-5 md:gap-x-8 gap-y-3 py-7 border-b items-start"
      style={{ borderColor: P.rule }}
    >
      <span
        className="text-xs font-mono font-semibold tabular-nums pt-1.5"
        style={{ color: P.text3 }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        {tags[0] && (
          <div className="text-xs font-bold uppercase tracking-[0.22em] mb-2" style={{ color: P.purple }}>
            {tags[0]}
          </div>
        )}
        <h3
          className="text-xl md:text-2xl font-bold leading-[1.15] tracking-[-0.01em] text-foreground mb-2 group-hover:underline decoration-2 underline-offset-[5px]"
          style={{ textDecorationColor: P.purple }}
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
        <div
          className="hidden md:block w-40 h-28 shrink-0"
          style={{
            background: `repeating-linear-gradient(135deg, ${P.purpleSoft} 0 8px, transparent 8px 16px)`,
          }}
        />
      )}
    </Link>
  );
}

export default function BlogPage() {
  const { user } = useAuth();
  const [activeTag, setActiveTag] = useState<string>("");

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["blogs", "all"],
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
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-5xl px-6 lg:px-10 py-10 lg:py-14">
        {/* Masthead */}
        <header className="pb-7 border-b border-foreground/60">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3" style={{ color: P.purple }}>
                KVIS Connect · Stories
              </p>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95] text-foreground">
                Stories
              </h1>
              <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-[55ch] leading-relaxed">
                Essays, updates, and reflections from KVIS alumni — at home and abroad.
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
          <div
            className="flex items-center gap-3 md:gap-4 mt-6 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap"
            style={{ color: P.text3 }}
          >
            <span>{issueLabel}</span>
            <span aria-hidden>·</span>
            <span>
              {blogs.length} {blogs.length === 1 ? "post" : "posts"}
            </span>
          </div>
        </header>

        {/* Sections / tag rail */}
        {allTags.length > 0 && (
          <nav
            className="grid grid-cols-[72px_1fr] md:grid-cols-[100px_1fr] items-baseline gap-x-5 gap-y-2 py-4 border-b"
            style={{ borderColor: P.rule }}
          >
            <span
              className="text-xs uppercase tracking-[0.26em] font-bold"
              style={{ color: P.text3 }}
            >
              Tags
            </span>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2.5">
              {[{ name: "All", count: blogs.length, key: "" } as { name: string; count: number; key: string }]
                .concat(allTags.map(([t, c]) => ({ name: t, count: c, key: t })))
                .map(({ name, count, key }) => {
                  const active = activeTag === key;
                  return (
                    <button
                      key={key || "all"}
                      onClick={() => setActiveTag(active ? "" : key)}
                      className="group/tag text-sm font-semibold uppercase tracking-[0.14em] transition-colors leading-none"
                      style={{
                        color: active ? P.purple : undefined,
                        textDecoration: active ? "underline" : "none",
                        textDecorationThickness: 2,
                        textUnderlineOffset: 6,
                      }}
                    >
                      <span
                        className={active ? "" : "text-muted-foreground group-hover/tag:text-foreground transition-colors"}
                        style={active ? { color: P.purple } : undefined}
                      >
                        {name}
                      </span>
                      <sup className="ml-1 text-xs font-mono tabular-nums" style={{ color: P.text3 }}>
                        {count}
                      </sup>
                    </button>
                  );
                })}
            </div>
          </nav>
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
          <div className="py-24 text-center">
            <p
              className="text-xs uppercase tracking-[0.28em] font-bold mb-4"
              style={{ color: P.text3 }}
            >
              Nothing here yet
            </p>
            <p className="text-3xl font-black tracking-tight text-foreground mb-2">
              {activeTag ? `No posts tagged "${activeTag}"` : "No posts yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {activeTag ? (
                <button onClick={() => setActiveTag("")} className="underline" style={{ color: P.purple }}>
                  See all posts
                </button>
              ) : user ? (
                "Be the first to share something."
              ) : (
                "Check back soon."
              )}
            </p>
          </div>
        )}

        {/* Featured */}
        {!isLoading && featured && <FeaturedStory blog={featured} />}

        {/* The rest */}
        {!isLoading && rest.length > 0 && (
          <section>
            <h2
              className="pt-10 pb-4 text-xs uppercase tracking-[0.26em] font-bold"
              style={{ color: P.text3 }}
            >
              More posts
            </h2>
            <div>
              {rest.map((b, i) => (
                <StoryRow key={b.id} blog={b} index={i} />
              ))}
            </div>
          </section>
        )}

        {!isLoading && filtered.length > 0 && (
          <footer
            className="mt-16 pt-6 border-t border-foreground/60 text-muted-foreground text-xs uppercase tracking-[0.22em] flex items-center justify-between"
          >
            <span>— end —</span>
            <span className="tabular-nums">
              KVIS Connect · {now.getFullYear()}
            </span>
          </footer>
        )}
      </div>
    </div>
  );
}
