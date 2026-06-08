"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blogApi } from "@/lib/api";
import { keys } from "@/lib/cache/keys";
import { onBlogDeleteSuccess } from "@/lib/cache/invalidate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowLeft, Trash2, Heart, MessageSquare, Lock, Unlock, ChevronDown, ChevronUp, CornerDownRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { cohortColor, cohortTextColor, cohortColorHex, cohortColorSoftHex, formatDate, genLabel } from "@/lib/utils";
import { toast } from "sonner";
import { PageEntrance, FadeUp } from "@/components/ui/motion";
import { useState, useEffect, useRef } from "react";
import type { BlogComment } from "@/lib/types";

// Nest flat comments into tree
function nestComments(flat: BlogComment[]): BlogComment[] {
  const map = new Map<string, BlogComment>();
  const roots: BlogComment[] = [];
  flat.forEach(c => map.set(c.id, { ...c, replies: [] }));
  map.forEach(c => {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies!.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

function CommentAvatar({ author, size = 32 }: { author: BlogComment["author"]; size?: number }) {
  const name = `${author.first_name} ${author.last_name}`;
  const initials = name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const color = cohortColorHex(author.kvis_year);
  const colorSoft = cohortColorSoftHex(author.kvis_year);
  const textColor = cohortTextColor(author.kvis_year);
  const ringColor = cohortColor(author.kvis_year);
  return (
    <Avatar style={{ width: size, height: size, outline: `2px solid ${ringColor}`, outlineOffset: "1px", flexShrink: 0 }}>
      <AvatarImage src={author.profile_pic_url} alt={name} />
      <AvatarFallback style={{ background: `linear-gradient(135deg, ${color}, ${colorSoft})`, color: textColor, fontSize: size * 0.35 }}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

function CommentInput({ slug, parentId, onDone, autoFocus = false }: {
  slug: string; parentId?: string; onDone: (c: BlogComment) => void; autoFocus?: boolean;
}) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const c = await blogApi.addComment(slug, text.trim(), parentId);
      setText("");
      onDone(c);
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <textarea
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={parentId ? "Write a reply..." : "Write a comment..."}
        rows={3}
        className="w-full bg-transparent border border-[var(--kvis-rule)] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[var(--kvis-purple)] transition-colors resize-none"
      />
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          onClick={submit}
          disabled={submitting || !text.trim()}
          className="h-auto rounded-none bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-background hover:bg-foreground/90 disabled:opacity-40"
        >
          {submitting ? "Posting..." : parentId ? "Reply" : "Post"}
        </Button>
      </div>
    </div>
  );
}

function CommentNode({ comment, slug, user, depth = 0, onDelete, onAdd }: {
  comment: BlogComment;
  slug: string;
  user: any;
  depth?: number;
  onDelete: (id: string) => void;
  onAdd: (c: BlogComment) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const color = cohortColor(comment.author.kvis_year);
  const hasReplies = (comment.replies?.length ?? 0) > 0;
  const isOwn = user?.id === comment.author.id;
  const maxDepthColor = depth % 2 === 0 ? "var(--kvis-purple)" : "var(--kvis-green-light)";

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;
    try {
      await blogApi.deleteComment(slug, comment.id);
      onDelete(comment.id);
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="flex gap-3">
      {/* Left thread line */}
      {depth > 0 && (
        <div className="flex flex-col items-center" style={{ minWidth: 20 }}>
          <div className="w-px flex-1 mt-1" style={{ background: `${maxDepthColor}40` }} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Comment header */}
        <div className="flex items-start gap-2.5 mb-2">
          <Link href={`/profile/${comment.author.slug}`}>
            <CommentAvatar author={comment.author} size={28} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/profile/${comment.author.slug}`}
                className="text-xs font-bold text-foreground hover:underline">
                {comment.author.first_name} {comment.author.last_name}
              </Link>
              {comment.author.kvis_year && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${cohortColorHex(comment.author.kvis_year)}22`, color }}>
                  {genLabel(comment.author.kvis_year)}
                </span>
              )}
              <span className="text-[10px] text-[var(--kvis-text3)] font-mono">
                {formatDate(comment.created_at)}
              </span>
            </div>
            {/* Comment body */}
            <p className="text-sm text-foreground leading-relaxed mt-1 whitespace-pre-wrap">
              {comment.content}
            </p>
            {/* Actions */}
            <div className="flex items-center gap-3 mt-1.5">
              {user && (
                <button
                  onClick={() => setReplying(v => !v)}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors"
                  style={{ color: replying ? "var(--kvis-purple)" : "var(--kvis-text3)" }}
                >
                  <CornerDownRight className="h-3 w-3" />
                  Reply
                </button>
              )}
              {hasReplies && (
                <button
                  onClick={() => setCollapsed(v => !v)}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--kvis-text3)] hover:text-foreground transition-colors"
                >
                  {collapsed
                    ? <><ChevronDown className="h-3 w-3" /> {comment.replies!.length} {comment.replies!.length === 1 ? "reply" : "replies"}</>
                    : <><ChevronUp className="h-3 w-3" /> Collapse</>
                  }
                </button>
              )}
              {isOwn && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--kvis-text3)] hover:text-destructive transition-colors ml-auto"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reply input */}
        {replying && (
          <div className="mt-2 mb-3 ml-8">
            <CommentInput
              slug={slug}
              parentId={comment.id}
              autoFocus
              onDone={(c) => { onAdd(c); setReplying(false); }}
            />
          </div>
        )}

        {/* Nested replies */}
        {!collapsed && hasReplies && (
          <div className="mt-2 space-y-3 ml-2">
            {comment.replies!.map(reply => (
              <CommentNode
                key={reply.id}
                comment={reply}
                slug={slug}
                user={user}
                depth={depth + 1}
                onDelete={onDelete}
                onAdd={onAdd}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BlogDetailClient({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  const { data: blog, isLoading, error } = useQuery({
    queryKey: keys.blog.detail(slug),
    queryFn: () => blogApi.get(slug),
  });

  // Fetch likes
  useEffect(() => {
    if (!blog || !user) return;
    setLikeCount(blog.likes ?? 0);
    setCommentsEnabled((blog as { comments_enabled?: boolean }).comments_enabled ?? true);
    blogApi.getLike(slug)
      .then(({ likes, liked }) => { setLikeCount(likes); setLiked(liked); })
      .catch(() => {});
  }, [blog, slug, user]);

  // Fetch comments
  useEffect(() => {
    if (!blog) return;
    blogApi.getComments(slug)
      .then(flat => setComments(nestComments(flat)))
      .catch(() => {});
  }, [blog, slug]);

  const handleLike = async () => {
    if (!user) { toast.error("Sign in to like posts"); return; }
    setLikeLoading(true);
    try {
      const { likes, liked: newLiked } = await blogApi.toggleLike(slug);
      setLikeCount(likes);
      setLiked(newLiked);
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

  const handleToggleComments = async () => {
    try {
      const { comments_enabled } = await blogApi.toggleComments(slug);
      setCommentsEnabled(comments_enabled);
      toast.success(comments_enabled ? "Comments opened" : "Comments closed");
    } catch {
      toast.error("Failed to toggle comments");
    }
  };

  // Add comment to tree (handles both top-level and nested)
  const addComment = (c: BlogComment) => {
    if (!c.parent_id) {
      setComments(prev => [...prev, { ...c, replies: [] }]);
      return;
    }
    const addToTree = (nodes: BlogComment[]): BlogComment[] =>
      nodes.map(n => n.id === c.parent_id
        ? { ...n, replies: [...(n.replies ?? []), { ...c, replies: [] }] }
        : { ...n, replies: addToTree(n.replies ?? []) }
      );
    setComments(prev => addToTree(prev));
  };

  // Delete comment from tree
  const deleteComment = (id: string) => {
    const removeFromTree = (nodes: BlogComment[]): BlogComment[] =>
      nodes.filter(n => n.id !== id).map(n => ({ ...n, replies: removeFromTree(n.replies ?? []) }));
    setComments(prev => removeFromTree(prev));
  };

  const deleteMutation = useMutation({
    mutationFn: () => blogApi.delete(slug),
    onSuccess: () => {
      onBlogDeleteSuccess(qc, slug);
      router.push("/blog");
      toast.success("Post deleted");
    },
  });

  const totalComments = (nodes: BlogComment[]): number =>
    nodes.reduce((acc, n) => acc + 1 + totalComments(n.replies ?? []), 0);

  if (isLoading) {
    return (
      <PageEntrance>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-64 w-full rounded-xl mb-8" />
          <Skeleton className="h-8 w-2/3 mb-4" />
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
  const tags = (blog.tags ?? "").split(",").map(t => t.trim()).filter(Boolean);
  const ringColor = cohortColor(blog.author.kvis_year);
  const count = totalComments(comments);

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
              {tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
          )}
          <h1 className="text-3xl font-bold leading-tight mb-4">{blog.title}</h1>
        </FadeUp>

        <FadeUp delay={0.15}>
          <div className="flex items-center justify-between mb-8 pb-6 border-b">
            <Link href={`/profile/${blog.author.slug}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Avatar className="h-10 w-10" style={{ outline: `2px solid ${ringColor}`, outlineOffset: "2px" }}>
                <AvatarImage src={blog.author.profile_pic_url ?? ""} />
                <AvatarFallback style={{
                  background: `linear-gradient(135deg, ${cohortColorHex(blog.author.kvis_year)} 0%, ${cohortColorSoftHex(blog.author.kvis_year)} 100%)`,
                  color: cohortTextColor(blog.author.kvis_year),
                }}>
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
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--kvis-text3)] hover:text-foreground"
                    onClick={handleToggleComments}
                  >
                    {commentsEnabled
                      ? <><Unlock className="h-3.5 w-3.5" /> Close comments</>
                      : <><Lock className="h-3.5 w-3.5" /> Open comments</>
                    }
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => { if (confirm("Delete this post?")) deleteMutation.mutate(); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
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

        {/* Comments section */}
        <FadeUp delay={0.3}>
          <section className="mt-12 pt-8 border-t border-[var(--kvis-rule)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[var(--kvis-text3)]" />
                <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-foreground">
                  Discussion
                </h2>
                {count > 0 && (
                  <span className="text-xs font-mono text-[var(--kvis-text3)]">· {count}</span>
                )}
              </div>
              {!commentsEnabled && (
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--kvis-text3)]">
                  <Lock className="h-3 w-3" /> Comments closed
                </span>
              )}
            </div>

            {/* Top-level input */}
            {commentsEnabled && user && (
              <div className="mb-8">
                <CommentInput slug={slug} onDone={addComment} />
              </div>
            )}

            {commentsEnabled && !user && (
              <div className="mb-8 px-4 py-3 border border-[var(--kvis-rule)] rounded-lg text-sm text-muted-foreground">
                <Link href="/auth/login" className="text-[var(--kvis-purple)] font-semibold underline underline-offset-2">
                  Sign in
                </Link>{" "}to join the discussion.
              </div>
            )}

            {/* Comment tree */}
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                {commentsEnabled ? "No comments yet. Be the first." : "No comments."}
              </p>
            ) : (
              <div className="space-y-5">
                {comments.map(c => (
                  <CommentNode
                    key={c.id}
                    comment={c}
                    slug={slug}
                    user={user}
                    depth={0}
                    onDelete={deleteComment}
                    onAdd={addComment}
                  />
                ))}
              </div>
            )}
          </section>
        </FadeUp>

      </div>
    </PageEntrance>
  );
}