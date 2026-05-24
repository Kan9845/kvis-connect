"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blogApi, userApi } from "@/lib/api";
import { onBlogMutationSuccess } from "@/lib/cache/invalidate";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

const P = {
  purple: "oklch(44% 0.26 294)",
  purpleSoft: "oklch(95% 0.035 294)",
  green: "oklch(40% 0.16 148)",
  text2: "oklch(45% 0.008 294)",
  text3: "oklch(62% 0.005 294)",
  rule: "oklch(90% 0.007 294)",
  ruleHeavy: "oklch(78% 0.008 294)",
};

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  excerpt: z.string().optional(),
  cover_image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  tags: z.string().optional(),
  is_published: z.boolean(),
});

type FormData = z.infer<typeof schema>;

function SectionHead({
  numeral,
  label,
  hint,
}: {
  numeral: string;
  label: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3 md:block">
        <p
          className="font-mono text-2xl md:text-3xl font-black tabular-nums leading-none"
          style={{ color: P.purple }}
        >
          {numeral}
        </p>
        <p
          className="text-xs font-bold uppercase tracking-[0.26em] text-foreground md:mt-3"
        >
          {label}
        </p>
      </div>
      {hint && (
        <p
          className="mt-2 md:mt-3 text-xs italic leading-snug max-w-[24ch]"
          style={{ color: P.text3 }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs mt-3 uppercase tracking-[0.18em] font-semibold text-destructive">
      ✕ {msg}
    </p>
  );
}

const sectionGrid =
  "grid md:grid-cols-[180px_1fr] gap-x-10 gap-y-5 py-10 lg:py-12 border-t";

const inputBare =
  "w-full bg-transparent border-0 border-b py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors";

export default function NewBlogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"write" | "preview">("write");
  const coverImageRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_published: false, content: "" },
  });

  const title = watch("title") ?? "";
  const content = watch("content") ?? "";
  const tags = watch("tags") ?? "";
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const mutation = useMutation({
    mutationFn: (data: FormData) => blogApi.create({
      ...data,
      cover_image_url: data.cover_image_url || undefined,
      excerpt: data.excerpt || undefined,
    }),
    onSuccess: (blog) => {
      onBlogMutationSuccess(qc, blog);
      toast.success("Posted.");
      router.push(`/blog/${blog.slug}`);
    },
    onError: () => {
      toast.error("Couldn't post - try again.");
    },
  });

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const { url } = await userApi.uploadProfilePic(file);
      setValue("cover_image_url", url, { shouldValidate: true });
      toast.success("Cover image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setCoverUploading(false);
      e.target.value = "";
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const now = new Date();
  const dateLine = now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }).toUpperCase();
  const readMins = Math.max(1, Math.round(wordCount / 220));

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-4xl px-6 lg:px-10 py-10 lg:py-14">
        {/* Masthead */}
        <header className="pb-8 border-b-2 border-foreground/70">
          <p
            className="text-xs font-bold uppercase tracking-[0.3em] mb-3"
            style={{ color: P.purple }}
          >
            KVIS Connect · New post
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95] text-foreground">
            Write a post
          </h1>
          <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-[55ch] leading-relaxed">
            Share an essay, story, or update with the alumni network. Markdown supported.
          </p>
          <div
            className="flex items-center gap-3 md:gap-4 mt-6 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap"
            style={{ color: P.text3 }}
          >
            <span>By {user.first_name} {user.last_name}</span>
            <span aria-hidden>·</span>
            <span>{dateLine}</span>
            <span aria-hidden>·</span>
            <span>
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
            <span aria-hidden>·</span>
            <span>~ {readMins} min read</span>
          </div>
        </header>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          {/* I - Headline */}
          <section className={sectionGrid} style={{ borderColor: P.ruleHeavy }}>
            <SectionHead
              numeral="01"
              label="Title"
              hint="Keep it short - twelve words or fewer."
            />
            <div>
              <input
                {...register("title")}
                placeholder="What's the post about?"
                className="w-full bg-transparent border-0 text-3xl md:text-4xl lg:text-5xl font-black tracking-[-0.02em] leading-[1.05] text-foreground placeholder:text-muted-foreground/35 focus:outline-none"
              />
              <FieldError msg={errors.title?.message} />
            </div>
          </section>

          {/* II - Deck */}
          <section className={sectionGrid} style={{ borderColor: P.rule }}>
            <SectionHead
              numeral="02"
              label="Summary"
              hint="A one-sentence pitch, shown beneath the title on the list page."
            />
            <div>
              <textarea
                {...register("excerpt")}
                rows={2}
                placeholder="A short summary - why someone should read this."
                className="w-full bg-transparent border-0 text-lg md:text-xl leading-relaxed text-foreground/80 placeholder:text-muted-foreground/45 focus:outline-none resize-none"
              />
            </div>
          </section>

          {/* III - Cover plate */}
          <section className={sectionGrid} style={{ borderColor: P.rule }}>
            <SectionHead
              numeral="03"
              label="Cover image"
              hint="Optional - a photo to lead the post."
            />
            <div>
              <input
                {...register("cover_image_url")}
                placeholder="https://…"
                className={`${inputBare} font-mono text-sm`}
                style={{ borderColor: P.rule }}
              />
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => coverImageRef.current?.click()}
                  disabled={coverUploading}
                  className="text-xs font-bold uppercase tracking-[0.26em] px-4 py-2 border border-foreground/60 hover:bg-foreground/5 transition-colors disabled:opacity-40 inline-flex items-center gap-2"
                >
                  {coverUploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : null}
                  {coverUploading ? "Uploading…" : "Upload image"}
                </button>
                <span
                  className="text-xs uppercase tracking-[0.2em]"
                  style={{ color: P.text3 }}
                >
                  or paste a URL above
                </span>
              </div>
              <input
                ref={coverImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
              <FieldError msg={errors.cover_image_url?.message} />
            </div>
          </section>

          {/* IV - Sections (tags) */}
          <section className={sectionGrid} style={{ borderColor: P.rule }}>
            <SectionHead
              numeral="04"
              label="Tags"
              hint="Comma-separated. Used to group related posts."
            />
            <div>
              <input
                {...register("tags")}
                placeholder="Career, Research, Life"
                className={`${inputBare} text-sm`}
                style={{ borderColor: P.rule }}
              />
              {tags.trim() && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                    <span
                      key={t}
                      className="text-xs font-bold uppercase tracking-[0.22em] px-2 py-1"
                      style={{ background: P.purpleSoft, color: P.purple }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 05 - Body */}
          <section
            className="pt-10 lg:pt-12 border-t-2"
            style={{ borderColor: P.ruleHeavy }}
          >
            <div className="flex items-end justify-between gap-6 flex-wrap mb-5">
              <div className="flex items-baseline gap-4">
                <span
                  className="font-mono text-2xl md:text-3xl font-black tabular-nums leading-none"
                  style={{ color: P.purple }}
                >
                  05
                </span>
                <h2 className="text-xs font-bold uppercase tracking-[0.26em] text-foreground">
                  Body
                </h2>
              </div>

              <div className="flex items-center gap-5">
                {(["write", "preview"] as const).map((t) => {
                  const active = tab === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      className="text-xs font-bold uppercase tracking-[0.26em] transition-colors"
                      style={{
                        color: active ? P.purple : P.text3,
                        textDecoration: active ? "underline" : "none",
                        textDecorationThickness: 2,
                        textUnderlineOffset: 8,
                      }}
                    >
                      {t === "write" ? "Write" : "Preview"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editor frame */}
            <div className="border" style={{ borderColor: P.rule }}>
              <div
                className="flex items-center justify-between px-4 md:px-5 py-2 border-b text-xs uppercase tracking-[0.22em] tabular-nums"
                style={{ borderColor: P.rule, color: P.text3 }}
              >
                <span>
                  {tab === "write" ? "Markdown" : "Preview"}
                </span>
                <span>
                  {wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"} ·{" "}
                  {charCount.toLocaleString()} chars
                </span>
              </div>

              {tab === "write" ? (
                <textarea
                  {...register("content")}
                  rows={22}
                  placeholder={`Start writing your post…

## A sub-heading

**Bold** for emphasis, *italics* for asides.

- A bulleted list
- Of supporting points

> A pulled quote, if it fits.`}
                  className="block w-full bg-transparent border-0 px-4 md:px-5 py-5 font-serif text-[17px] leading-[1.75] text-foreground placeholder:text-muted-foreground/45 focus:outline-none resize-none"
                />
              ) : (
                <div className="px-4 md:px-5 py-6 min-h-[500px]">
                  {content.trim() ? (
                    <article className="prose prose-lg max-w-none">
                      {title && (
                        <h1 className="text-4xl md:text-5xl font-black tracking-[-0.02em] leading-[1.05] text-foreground !mb-6">
                          {title}
                        </h1>
                      )}
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </article>
                  ) : (
                    <p
                      className="text-center text-xs uppercase tracking-[0.28em] py-20"
                      style={{ color: P.text3 }}
                    >
                      Nothing to preview yet - start writing.
                    </p>
                  )}
                </div>
              )}
            </div>

            <FieldError msg={errors.content?.message} />
          </section>

          {/* Actions */}
          <footer className="mt-12 pt-7 border-t-2 border-foreground/70 flex items-center justify-between flex-wrap gap-4">
            <p
              className="text-xs uppercase tracking-[0.22em] max-w-[40ch] leading-relaxed"
              style={{ color: P.text3 }}
            >
              Drafts stay private until you publish.
            </p>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={mutation.isPending || isSubmitting}
                onClick={() => setValue("is_published", false)}
                className="text-xs font-bold uppercase tracking-[0.26em] px-5 py-3 border border-foreground/60 hover:bg-foreground/5 transition-colors disabled:opacity-40"
              >
                Save draft
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || isSubmitting}
                onClick={() => setValue("is_published", true)}
                className="text-xs font-bold uppercase tracking-[0.26em] px-6 py-3 bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-40 inline-flex items-center gap-2"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Publish
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
