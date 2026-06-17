"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { blogApi } from "@/lib/api";
import { onBlogMutationSuccess } from "@/lib/cache/invalidate";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, Send, Dot, Globe, Lock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { keys } from "@/lib/cache/keys";

const P = {
  purple: "var(--kvis-purple)",
  purpleSoft: "var(--kvis-purple-soft)",
  text3: "var(--kvis-text3)",
  rule: "var(--kvis-rule)",
  ruleHeavy: "var(--kvis-border)",
};

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  cover_image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  tags: z.string().optional(),
  visibility: z.enum(["public", "kvis_only"]).default("public"),
});

type FormData = z.infer<typeof schema>;

const sectionGrid = "grid md:grid-cols-[180px_1fr] gap-x-10 gap-y-5 py-10 lg:py-12 border-t";
const inputBare = "w-full bg-transparent border-0 border-b py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs mt-3 uppercase tracking-[0.18em] font-semibold text-destructive">✕ {msg}</p>;
}

export default function EditBlogPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { user, loading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"write" | "preview">("write");
  const coverImageRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  const { data: blog, isLoading: blogLoading } = useQuery({
    queryKey: keys.blog.detail(slug),
    queryFn: () => blogApi.get(slug),
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { content: "" },
  });

  useEffect(() => {
    if (blog) {
      reset({
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt ?? "",
        cover_image_url: blog.cover_image_url ?? "",
        tags: blog.tags ?? "",
        visibility: (blog.visibility as "public" | "kvis_only") ?? "public",
      });
    }
  }, [blog, reset]);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  const mutation = useMutation({
    mutationFn: (data: FormData & { is_published: boolean }) =>
      blogApi.update(slug, {
        ...data,
        cover_image_url: data.cover_image_url || undefined,
        excerpt: data.excerpt || undefined,
      }),
    onSuccess: (blog) => {
      onBlogMutationSuccess(qc, blog);
      toast.success(blog.is_published ? "Published!" : "Draft saved.");
      router.push(`/blog/${blog.slug}`);
    },
    onError: () => toast.error("Couldn't save - try again."),
  });

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const { url } = await blogApi.uploadFile(file);
      setValue("cover_image_url", url, { shouldValidate: true });
      toast.success("Cover image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setCoverUploading(false);
      e.target.value = "";
    }
  };

  const title = watch("title") ?? "";
  const content = watch("content") ?? "";
  const tags = watch("tags") ?? "";
  const wordCount = useMemo(() => {
    if (!content.trim()) return 0;
    // Check if content contains Thai characters
    const hasThai = /[\u0E00-\u0E7F]/.test(content);
    if (hasThai) {
      try {
        const segmenter = new Intl.Segmenter("th", { granularity: "word" });
        const segments = segmenter.segment(content);
        let count = 0;
        for (const s of segments) {
          if (s.isWordLike) count++;
        }
        return count;
      } catch {
        // Fallback if Intl.Segmenter not supported
        return content.replace(/\s+/g, "").length;
      }
    }
    return content.trim().split(/\s+/).length;
  }, [content]);
  const charCount = content.length;
  const readMins = Math.max(1, Math.round(wordCount / 220));

  if (loading || blogLoading || !user) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (blog && blog.author.id !== user.id) {
    router.push(`/blog/${slug}`);
    return null;
  }

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-4xl px-6 lg:px-10 py-xl lg:py-layout">
        <header className="pb-8 border-b-2 border-[var(--sep-strong)]">
          <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 flex items-center gap-1" style={{ color: P.purple }}>
            KVIS Connect <Dot className="h-3 w-3 shrink-0" /> Edit post
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-black tracking-[-0.03em] leading-[0.95] text-foreground">
            Edit post
          </h1>
          <div className="flex items-center gap-3 mt-6 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap" style={{ color: P.text3 }}>
            <span>By {user.first_name} {user.last_name}</span>
            <Dot className="h-3 w-3 shrink-0" />
            <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
            <Dot className="h-3 w-3 shrink-0" />
            <span>~ {readMins} min read</span>
          </div>
        </header>

        <form>
          <section className={sectionGrid} style={{ borderColor: P.ruleHeavy }}>
            <div><p className="font-mono text-2xl font-black" style={{ color: P.purple }}>01</p><p className="text-xs font-bold uppercase tracking-[0.26em] mt-3">Title</p></div>
            <div>
              <input {...register("title")} placeholder="What's the post about?" className="w-full bg-transparent border-0 text-3xl md:text-5xl font-black tracking-[-0.02em] text-foreground placeholder:text-muted-foreground/35 focus:outline-none" />
              <FieldError msg={errors.title?.message} />
            </div>
          </section>

          <section className={sectionGrid} style={{ borderColor: P.rule }}>
            <div><p className="font-mono text-2xl font-black" style={{ color: P.purple }}>02</p><p className="text-xs font-bold uppercase tracking-[0.26em] mt-3">Summary</p></div>
            <textarea {...register("excerpt")} rows={2} placeholder="A short summary." className="w-full bg-transparent border-0 text-lg leading-relaxed text-foreground/80 placeholder:text-muted-foreground/45 focus:outline-none resize-none" />
          </section>

          <section className={sectionGrid} style={{ borderColor: P.rule }}>
            <div><p className="font-mono text-2xl font-black" style={{ color: P.purple }}>03</p><p className="text-xs font-bold uppercase tracking-[0.26em] mt-3">Cover image</p></div>
            <div>
              <input {...register("cover_image_url")} placeholder="https://…" className={`${inputBare} font-mono text-sm`} style={{ borderColor: P.rule }} />
              <div className="flex items-center gap-3 mt-3">
                <button type="button" onClick={() => coverImageRef.current?.click()} disabled={coverUploading} className="text-xs font-bold uppercase tracking-[0.26em] px-4 py-2 border border-[var(--sep-strong)] hover:bg-foreground/5 transition-colors disabled:opacity-40 inline-flex items-center gap-2">
                  {coverUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  {coverUploading ? "Uploading…" : "Upload image"}
                </button>
              </div>
              <input ref={coverImageRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              <FieldError msg={errors.cover_image_url?.message} />
            </div>
          </section>

          <section className={sectionGrid} style={{ borderColor: P.rule }}>
            <div><p className="font-mono text-2xl font-black" style={{ color: P.purple }}>04</p><p className="text-xs font-bold uppercase tracking-[0.26em] mt-3">Tags</p></div>
            <div>
              <input {...register("tags")} placeholder="Career, Research, Life" className={`${inputBare} text-sm`} style={{ borderColor: P.rule }} />
              {tags.trim() && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                    <span key={t} className="text-xs font-bold uppercase tracking-[0.22em] px-2 py-1" style={{ background: P.purpleSoft, color: P.purple }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="pt-10 lg:pt-12 border-t-2" style={{ borderColor: P.ruleHeavy }}>
            <div className="flex items-end justify-between gap-6 flex-wrap mb-5">
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-2xl font-black" style={{ color: P.purple }}>05</span>
                <h2 className="text-xs font-bold uppercase tracking-[0.26em]">Body</h2>
              </div>
              <div className="flex items-center gap-5">
                {(["write", "preview"] as const).map(t => (
                  <button key={t} type="button" onClick={() => setTab(t)} className="text-xs font-bold uppercase tracking-[0.26em] transition-colors" style={{ color: tab === t ? P.purple : P.text3, textDecoration: tab === t ? "underline" : "none", textDecorationThickness: 2, textUnderlineOffset: 8 }}>
                    {t === "write" ? "Write" : "Preview"}
                  </button>
                ))}
              </div>
            </div>

            <div className="border" style={{ borderColor: P.rule }}>
              <div className="flex items-center justify-between px-5 py-2 border-b text-xs uppercase tracking-[0.22em]" style={{ borderColor: P.rule, color: P.text3 }}>
                <span>{tab === "write" ? "Markdown" : "Preview"}</span>
                <span>{wordCount.toLocaleString()} words <Dot className="inline h-3 w-3" /> {charCount.toLocaleString()} chars</span>
              </div>
              {tab === "write" ? (
                <textarea {...register("content")} rows={22} placeholder="Start writing…" className="block w-full bg-transparent border-0 px-5 py-5 font-serif text-[17px] leading-[1.75] text-foreground placeholder:text-muted-foreground/45 focus:outline-none resize-none" />
              ) : (
                <div className="px-5 py-6 min-h-[500px]">
                  {content.trim() ? (
                    <article className="prose prose-lg max-w-none">
                      {title && <h1 className="font-display text-5xl font-black tracking-[-0.03em] leading-[0.95]">{title}</h1>}
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </article>
                  ) : (
                    <p className="text-center text-xs uppercase tracking-[0.28em] py-20" style={{ color: P.text3 }}>Nothing to preview yet.</p>
                  )}
                </div>
              )}
            </div>
            <FieldError msg={errors.content?.message} />
          </section>

          <footer className="mt-12 pt-7 border-t-2 border-[var(--sep-strong)] flex items-center justify-between flex-wrap gap-4">
            <p className="text-xs uppercase tracking-[0.22em]" style={{ color: P.text3 }}>Drafts stay private until you publish.</p>
            {/* Visibility */}
            <div className="flex items-center gap-3">
              {(["public", "kvis_only"] as const).map((v) => {
                const selected = watch("visibility") === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setValue("visibility", v)}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] px-3 py-2 border transition-colors"
                    style={{
                      borderColor: selected ? "var(--kvis-purple)" : "var(--kvis-border)",
                      color: selected ? "var(--kvis-purple)" : "var(--kvis-text3)",
                      background: selected ? "var(--kvis-purple-soft)" : "transparent",
                    }}
                  >
                    {v === "public" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {v === "public" ? "Public" : "KVIS Only"}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-4">
              <button type="button" disabled={mutation.isPending || isSubmitting}
                onClick={handleSubmit(d => mutation.mutate({ ...d, is_published: false }))}
                className="text-xs font-bold uppercase tracking-[0.26em] px-5 py-3 border border-[var(--sep-strong)] hover:bg-foreground/5 transition-colors disabled:opacity-40">
                Save draft
              </button>
              <button type="button" disabled={mutation.isPending || isSubmitting}
                onClick={handleSubmit(d => {
                  if (d.content.trim().length < 50) { toast.error("Content must be at least 50 characters to publish"); return; }
                  mutation.mutate({ ...d, is_published: true });
                })}
                className="text-xs font-bold uppercase tracking-[0.26em] px-6 py-3 bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-40 inline-flex items-center gap-2">
                {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Publish
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}