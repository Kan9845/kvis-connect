"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blogApi } from "@/lib/api";
import { keys } from "@/lib/cache/keys";
import { onBlogDeleteSuccess } from "@/lib/cache/invalidate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowLeft, Trash2, Heart } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { cohortColor, cohortTextColor, cohortColorHex, cohortColorSoftHex, formatDate, genLabel } from "@/lib/utils";
import { toast } from "sonner";
import { PageEntrance, FadeUp } from "@/components/ui/motion";
import { useState, useEffect } from "react";

export default function BlogDetailClient({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  const { data: blog, isLoading, error } = useQuery({
    queryKey: keys.blog.detail(slug),
    queryFn: () => blogApi.get(slug),
  });

  // Fetch like state
  useEffect(() => {
    if (!blog || !user) return;
    setLikeCount(blog.likes ?? 0);
    blogApi.getLike(slug)
      .then(({ likes, liked }) => { setLikeCount(likes); setLiked(liked); })
      .catch(() => {});
  }, [blog, slug, user]);

  const handleLike = async () => {
    if (!user) { toast.error("Sign in to like posts"); return; }
    setLikeLoading(true);
    try {
      const { likes, liked: newLiked } = await blogApi.toggleLike(slug);
      setLikeCount(likes);
      setLiked(newLiked);
      // Update blog list cache too
      qc.setQueriesData({ queryKey: keys.blog.list({ limit: 100 }) }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((b: any) => b.slug === slug ? { ...b, likes } : b);
      });
    } catch {
      toast.error("Failed to update like");
    } finally {
      setLikeLoading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: () => blogApi.delete(slug),
    onSuccess: () => {
      onBlogDeleteSuccess(qc, slug);
      router.push("/blog");
      toast.success("Post deleted");
    },
  });

  if (isLoading) {
    return (
      <PageEntrance>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-64 w-full rounded-xl mb-8" />
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </PageEntrance>
    );
  }

  if (error || !blog) {
    return (
      <PageEntrance>
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
          Post not found.
        </div>
      </PageEntrance>
    );
  }

  const isAuthor = user?.id === blog.author.id;
  const initials = `${blog.author.first_name[0] ?? ""}${blog.author.last_name[0] ?? ""}`.toUpperCase();
  const tags = (blog.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  const ringColor = cohortColor(blog.author.kvis_year);

  return (
    <PageEntrance>
      <div className="container mx-auto px-4 py-8 max-w-3xl">

        <FadeUp>
          <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
            <Link href="/blog"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Blog</Link>
          </Button>
        </FadeUp>

        {blog.cover_image_url && (
          <FadeUp delay={0.05}>
            <div className="relative h-72 w-full rounded-xl overflow-hidden mb-8">
              <Image src={blog.cover_image_url} alt={blog.title} fill className="object-cover" />
            </div>
          </FadeUp>
        )}

        <FadeUp delay={0.1}>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
          )}
          <h1 className="text-3xl font-bold leading-tight mb-4">{blog.title}</h1>
        </FadeUp>

        <FadeUp delay={0.15}>
          <div className="flex items-center justify-between mb-8 pb-6 border-b">
            <Link href={`/profile/${blog.author.slug}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Avatar className="h-10 w-10" style={{ outline: `2px solid ${ringColor}`, outlineOffset: "2px" }}>
                <AvatarImage src={blog.author.profile_pic_url ?? ""} />
                <AvatarFallback
                  style={{
                    background: `linear-gradient(135deg, ${cohortColorHex(blog.author.kvis_year)} 0%, ${cohortColorSoftHex(blog.author.kvis_year)} 100%)`,
                    color: cohortTextColor(blog.author.kvis_year),
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{blog.author.first_name} {blog.author.last_name}</p>
                {blog.author.kvis_year && (
                  <p className="text-xs font-bold" style={{ color: ringColor }}>
                    {genLabel(blog.author.kvis_year)}
                  </p>
                )}
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {blog.published_at ? formatDate(blog.published_at) : "Draft"}
              </span>
              {isAuthor && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => { if (confirm("Delete this post?")) deleteMutation.mutate(); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <article className="prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{blog.content}</ReactMarkdown>
          </article>
        </FadeUp>

        {/* Like button */}
        <FadeUp delay={0.25}>
          <div className="mt-12 pt-8 border-t border-[var(--kvis-rule)] flex items-center justify-center">
            <button
              type="button"
              onClick={handleLike}
              disabled={likeLoading}
              className="group flex flex-col items-center gap-2 transition-all disabled:opacity-50"
            >
              <div
                className="flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-200 group-hover:scale-110"
                style={{
                  borderColor: liked ? "var(--kvis-purple)" : "var(--kvis-rule)",
                  background: liked ? "var(--kvis-purple-soft)" : "transparent",
                }}
              >
                <Heart
                  className="h-6 w-6 transition-all duration-200"
                  style={{ color: liked ? "var(--kvis-purple)" : "var(--kvis-text3)" }}
                  fill={liked ? "var(--kvis-purple)" : "none"}
                />
              </div>
              <span
                className="text-xs font-bold uppercase tracking-[0.18em] transition-colors"
                style={{ color: liked ? "var(--kvis-purple)" : "var(--kvis-text3)" }}
              >
                {likeCount > 0 ? `${likeCount} ${likeCount === 1 ? "like" : "likes"}` : "Like this post"}
              </span>
            </button>
          </div>
        </FadeUp>

      </div>
    </PageEntrance>
  );
}