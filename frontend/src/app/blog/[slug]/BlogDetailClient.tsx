"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blogApi, userApi } from "@/lib/api";
import { keys } from "@/lib/cache/keys";
import { onBlogDeleteSuccess } from "@/lib/cache/invalidate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2, Heart, MessageSquare, Lock, Unlock, ChevronDown, ChevronUp, CornerDownRight, Dot, Pencil, Check, X } from "lucide-react";
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
import type { GlobePin } from "@/lib/types";

function renderWithMentions(content: string) {
  return content.replace(/@([\w-]+)/g, (_, slug) => `[@${slug}](/profile/${slug})`);
}

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
  const textColor = cohortTextColor(author.kvis_year);
  const ringColor = cohortColor(author.kvis_year);
  return (
    <Avatar style={{ width: size, height: size, outline: `2px solid ${ringColor}`, outlineOffset: "1px", flexShrink: 0 }}>
      <AvatarImage src={author.profile_pic_url} alt={name} />
      <AvatarFallback style={{ background: color, color: textColor, fontSize: size * 0.35 }}>{initials}</AvatarFallback>
    </Avatar>
  );
}

function MentionTextarea({ value, onChange, placeholder, rows = 3, autoFocus = false, pins }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
  pins: GlobePin[];
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mentionResults, setMentionResults] = useState<GlobePin[]>([]);
  const [mentionPos, setMentionPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/@([\w-]*)$/);
    if (match) {
      const query = match[1].toLowerCase();
      const results = pins.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query)
      ).slice(0, 5);
      setMentionResults(results);
      const ta = ref.current;
      if (ta) setMentionPos({ top: ta.offsetTop + ta.offsetHeight - 8, left: ta.offsetLeft + 10 });
    } else {
      setMentionResults([]);
      setMentionPos(null);
    }
  };

  const insertMention = (pin: GlobePin) => {
    const cursor = ref.current?.selectionStart ?? value.length;
    const textBefore = value.slice(0, cursor);
    const textAfter = value.slice(cursor);
    const replaced = textBefore.replace(/@[\w-]*$/, `@${pin.slug} `);
    onChange(replaced + textAfter);
    setMentionResults([]);
    setMentionPos(null);
    setTimeout(() => ref.current?.focus(), 0);
  };

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-transparent border border-[var(--kvis-border)] rounded-lg px-3 py-2.5 text-base md:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[var(--kvis-purple)] transition-colors resize-none"
      />
      {mentionResults.length > 0 && mentionPos && (
        <div className="absolute z-50 bg-background border border-[var(--kvis-border)] shadow-lg w-[calc(100vw-3rem)] max-w-[280px] rounded-lg overflow-hidden"
          style={{ top: mentionPos.top, left: 0 }}>
          {mentionResults.map(p => (
            <button key={p.user_id} type="button" onMouseDown={() => insertMention(p)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--kvis-purple-soft)] transition-colors text-left">
              <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "var(--kvis-purple)" }}>
                {p.first_name[0]}{p.last_name[0]}
              </div>
              <div>
                <p className="text-xs font-semibold">{p.first_name} {p.last_name}</p>
                <p className="text-xs text-muted-foreground">@{p.slug}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentInput({ slug, parentId, onDone, autoFocus = false, pins }: {
  slug: string; parentId?: string; onDone: (c: BlogComment) => void; autoFocus?: boolean; pins: GlobePin[];
}) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      <MentionTextarea
        value={text}
        onChange={setText}
        placeholder={parentId ? "Write a reply... Use @name to mention someone." : "Write a comment... Use @name to mention someone."}
        autoFocus={autoFocus}
        pins={pins}
      />
      <div className="flex gap-2 justify-end mt-2">
        <Button type="button" onClick={submit} disabled={submitting || !text.trim()}
          className="w-full sm:w-auto h-auto rounded-none bg-foreground px-4 py-3 text-xs font-bold uppercase tracking-[0.22em] text-background hover:bg-foreground/90 disabled:opacity-40">
          {submitting ? "Posting..." : parentId ? "Reply" : "Post"}
        </Button>
      </div>
    </div>
  );
}

function CommentNode({ comment, slug, user, depth = 0, onDelete, onAdd, onEdit, pins }: {
  comment: BlogComment;
  slug: string;
  user: any;
  depth?: number;
  onDelete: (id: string) => void;
  onAdd: (c: BlogComment) => void;
  onEdit: (id: string, content: string) => void;
  pins: GlobePin[];
}) {
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [editSubmitting, setEditSubmitting] = useState(false);
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

  const handleEdit = async () => {
    if (!editText.trim()) return;
    setEditSubmitting(true);
    try {
      const updated = await blogApi.editComment(slug, comment.id, editText.trim());
      onEdit(comment.id, updated.content);
      setEditing(false);
    } catch {
      toast.error("Failed to edit comment");
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="flex gap-3">
      {depth > 0 && (
        <div className="flex flex-col items-center" style={{ minWidth: 20 }}>
          <div className="w-px flex-1 mt-1" style={{ background: `${maxDepthColor}40` }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2.5 mb-2">
          <Link href={`/profile/${comment.author.slug}`}>
            <CommentAvatar author={comment.author} size={28} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/profile/${comment.author.slug}`} className="text-xs font-bold text-foreground hover:underline">
                {comment.author.first_name} {comment.author.last_name}
              </Link>
              {comment.author.kvis_year && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${cohortColorHex(comment.author.kvis_year)}22`, color }}>
                  {genLabel(comment.author.kvis_year)}
                </span>
              )}
              <span className="text-xs text-[var(--kvis-text3)] font-mono">{formatDate(comment.created_at)}</span>
            </div>

            {editing ? (
              <div className="mt-2">
                <MentionTextarea
                  value={editText}
                  onChange={setEditText}
                  placeholder="Edit your comment..."
                  rows={3}
                  autoFocus
                  pins={pins}
                />
                <div className="flex gap-2 mt-2 justify-end">
                  <button type="button" onClick={() => { setEditing(false); setEditText(comment.content); }}
                    className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--kvis-text3)] hover:text-foreground transition-colors">
                    <X className="h-3 w-3" /> Cancel
                  </button>
                  <button type="button" onClick={handleEdit} disabled={editSubmitting || !editText.trim()}
                    className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--kvis-purple)] hover:opacity-80 transition-colors disabled:opacity-40">
                    <Check className="h-3 w-3" /> {editSubmitting ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed mt-1 whitespace-pre-wrap">
                {comment.content.split(/(@[\w-]+)/g).map((part, i) =>
                  part.match(/^@[\w-]+$/) ? (
                    <Link key={i} href={`/profile/${part.slice(1)}`}
                      className="text-[var(--kvis-purple)] font-semibold hover:underline">
                      {part}
                    </Link>
                  ) : part
                )}
              </p>
            )}

            {!editing && (
              <div className="flex items-center gap-3 mt-1.5">
                {user && (
                  <button onClick={() => setReplying(v => !v)}
                    className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] transition-colors"
                    style={{ color: replying ? "var(--kvis-purple)" : "var(--kvis-text3)" }}>
                    <CornerDownRight className="h-3 w-3" /> Reply
                  </button>
                )}
                {hasReplies && (
                  <button onClick={() => setCollapsed(v => !v)}
                    className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--kvis-text3)] hover:text-foreground transition-colors">
                    {collapsed
                      ? <><ChevronDown className="h-3 w-3" /> {comment.replies!.length} {comment.replies!.length === 1 ? "reply" : "replies"}</>
                      : <><ChevronUp className="h-3 w-3" /> Collapse</>}
                  </button>
                )}
                {isOwn && (
                  <div className="flex items-center gap-3 ml-auto">
                    <button onClick={() => setEditing(true)}
                      className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--kvis-text3)] hover:text-foreground transition-colors">
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button onClick={handleDelete}
                      className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--kvis-text3)] hover:text-destructive transition-colors">
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {replying && (
          <div className="mt-2 mb-3 ml-4 md:ml-8">
            <CommentInput slug={slug} parentId={comment.id} autoFocus pins={pins}
              onDone={(c) => { onAdd(c); setReplying(false); }} />
          </div>
        )}

        {!collapsed && hasReplies && (
          <div className="mt-2 space-y-3 ml-2">
            {comment.replies!.map(reply => (
              <CommentNode key={reply.id} comment={reply} slug={slug} user={user}
                depth={depth + 1} onDelete={onDelete} onAdd={onAdd} onEdit={onEdit} pins={pins} />
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

  const { data: pins = [] } = useQuery({
    queryKey: keys.globe.pins(),
    queryFn: userApi.getGlobePins,
    staleTime: 5 * 60 * 1000,
  });

  const { data: blog, isLoading, error } = useQuery({
    queryKey: keys.blog.detail(slug),
    queryFn: () => blogApi.get(slug),
  });

  useEffect(() => {
    if (!blog || !user) return;
    setLikeCount(blog.likes ?? 0);
    setCommentsEnabled((blog as { comments_enabled?: boolean }).comments_enabled ?? true);
    blogApi.getLike(slug)
      .then(({ likes, liked }) => { setLikeCount(likes); setLiked(liked); })
      .catch(() => {});
  }, [blog, slug, user]);

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

  const addComment = (c: BlogComment) => {
    if (!c.parent_id) {
      setComments(prev => [...prev, { ...c, replies: [] }]);
      return;
    }
    const addToTree = (nodes: BlogComment[]): BlogComment[] =>
      nodes.map(n => n.id === c.parent_id
        ? { ...n, replies: [...(n.replies ?? []), { ...c, replies: [] }] }
        : { ...n, replies: addToTree(n.replies ?? []) });
    setComments(prev => addToTree(prev));
  };

  const deleteComment = (id: string) => {
    const removeFromTree = (nodes: BlogComment[]): BlogComment[] =>
      nodes.filter(n => n.id !== id).map(n => ({ ...n, replies: removeFromTree(n.replies ?? []) }));
    setComments(prev => removeFromTree(prev));
  };

  const editComment = (id: string, content: string) => {
    const updateInTree = (nodes: BlogComment[]): BlogComment[] =>
      nodes.map(n => n.id === id ? { ...n, content } : { ...n, replies: updateInTree(n.replies ?? []) });
    setComments(prev => updateInTree(prev));
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
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-xl lg:py-layout">
          {/* Back link */}
          <Skeleton className="h-3 w-20 mb-10" />
          {/* Tags */}
          <div className="flex gap-2 mb-5">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          {/* Title */}
          <Skeleton className="h-12 w-3/4 mb-3" />
          <Skeleton className="h-12 w-1/2 mb-6" />
          {/* Author row */}
          <div className="flex items-center gap-3 mb-8 pb-8 border-b border-[var(--kvis-border)]">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          {/* Cover image */}
          <Skeleton className="h-72 w-full mb-8" />
          {/* Content lines */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="pt-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </PageEntrance>
    );
  }

  if (error || !blog) {
    return (
      <PageEntrance>
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Post not found.</div>
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
      <div className="mx-auto max-w-3xl px-4 md:px-6 py-xl lg:py-layout">
        <FadeUp>
          <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--kvis-text3)] hover:text-foreground transition-colors mb-10 group">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> Stories
          </Link>
        </FadeUp>

        <FadeUp delay={0.05}>
          <header className="mb-8 pb-8 border-b border-[var(--sep-strong)]">
            {tags.length > 0 || blog.visibility === "kvis_only" ? (
              <div className="flex flex-wrap gap-1.5 mb-5 items-center">
                {blog.visibility === "kvis_only" && (
                  <span className="flex items-center gap-1 text-xs font-medium text-[var(--kvis-green-light)] opacity-70">
                    <Lock className="h-3 w-3" /> KVIS Only
                  </span>
                )}
                {tags.map(tag => (
                  <span key={tag} className="text-xs font-bold uppercase tracking-[0.14em] px-2.5 py-1"
                    style={{ background: "var(--kvis-purple-soft)", color: "var(--kvis-purple)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <h1 className="font-display text-4xl md:text-5xl font-black tracking-[-0.025em] leading-[0.95] text-foreground mb-6 break-words">
              {blog.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={`/profile/${blog.author.slug}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                <Avatar className="h-8 w-8" style={{ outline: `2px solid ${ringColor}`, outlineOffset: "2px" }}>
                  <AvatarImage src={blog.author.profile_pic_url ?? ""} />
                  <AvatarFallback style={{ background: `oklch(44% 0.26 294)`, color: cohortTextColor(blog.author.kvis_year) }}>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-foreground">{blog.author.first_name} {blog.author.last_name}</span>
                  {blog.author.kvis_year && (
                    <span className="text-xs font-bold" style={{ color: ringColor }}>{genLabel(blog.author.kvis_year)}</span>
                  )}
                </div>
              </Link>
              <Dot className="h-3 w-3 text-[var(--kvis-text3)] shrink-0" />
              <span className="text-xs text-[var(--kvis-text3)] tabular-nums">{blog.published_at ? formatDate(blog.published_at) : "Draft"}</span>
              {isAuthor && (
                <div className="ml-auto flex items-center gap-1">
                  <Link href={`/blog/${slug}/edit`} className="h-7 gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--kvis-text3)] hover:text-foreground px-2 inline-flex items-center">
                    <Pencil className="h-3 w-3" /> Edit
                  </Link>
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--kvis-text3)] hover:text-foreground px-2" onClick={handleToggleComments}>
                    {commentsEnabled ? <><Unlock className="h-3 w-3" /> Close</> : <><Lock className="h-3 w-3" /> Open</>}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => { if (confirm("Delete this post?")) deleteMutation.mutate(); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </header>
        </FadeUp>

        {blog.cover_image_url && (
          <FadeUp delay={0.1}>
            <div className="relative h-72 w-full overflow-hidden mb-8">
              <Image
                src={blog.cover_image_url}
                alt={blog.title}
                fill
                unoptimized
                className="object-contain bg-black/5"
              />
            </div>
          </FadeUp>
        )}

        <FadeUp delay={0.2}>
          <article className="prose prose-lg max-w-none break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {blog.content.replace(/@([\w-]+)/g, (_, s) => `[@${s}](/profile/${s})`)}
            </ReactMarkdown>
          </article>
        </FadeUp>

        <FadeUp delay={0.25}>
          <div className="mt-12 pt-8 border-t border-[var(--kvis-border)] flex items-center justify-center">
            <button type="button" onClick={handleLike} disabled={likeLoading}
              className="group flex flex-col items-center gap-2 transition-all disabled:opacity-50">
              <div className="flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-200 group-hover:scale-110"
                style={{ borderColor: liked ? "var(--kvis-purple)" : "var(--kvis-border)", background: liked ? "var(--kvis-purple-soft)" : "transparent" }}>
                <Heart className="h-6 w-6 transition-all duration-200"
                  style={{ color: liked ? "var(--kvis-purple)" : "var(--kvis-text3)" }}
                  fill={liked ? "var(--kvis-purple)" : "none"} />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] transition-colors"
                style={{ color: liked ? "var(--kvis-purple)" : "var(--kvis-text3)" }}>
                {likeCount > 0 ? `${likeCount} ${likeCount === 1 ? "like" : "likes"}` : "Like this post"}
              </span>
            </button>
          </div>
        </FadeUp>

        <FadeUp delay={0.3}>
          <section className="mt-12 pt-8 border-t border-[var(--kvis-border)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[var(--kvis-text3)]" />
                <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-foreground">Discussion</h2>
                {count > 0 && (
                  <span className="flex items-center gap-1.5 text-xs font-mono text-[var(--kvis-text3)]">
                    <Dot className="h-3 w-3 text-[var(--kvis-text3)] shrink-0" />{count}
                  </span>
                )}
              </div>
              {!commentsEnabled && (
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--kvis-text3)]">
                  <Lock className="h-3 w-3" /> Comments closed
                </span>
              )}
            </div>

            {commentsEnabled && user && (
              <div className="mb-8">
                <CommentInput slug={slug} onDone={addComment} pins={pins} />
              </div>
            )}

            {commentsEnabled && !user && (
              <div className="mb-8 px-4 py-3 border border-[var(--kvis-border)] rounded-lg text-sm text-muted-foreground">
                <Link href="/auth/login" className="text-[var(--kvis-purple)] font-semibold underline underline-offset-2">Sign in</Link>{" "}to join the discussion.
              </div>
            )}

            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                {commentsEnabled ? "No comments yet. Be the first." : "No comments."}
              </p>
            ) : (
              <div className="space-y-5">
                {comments.map(c => (
                  <CommentNode key={c.id} comment={c} slug={slug} user={user} depth={0}
                    onDelete={deleteComment} onAdd={addComment} onEdit={editComment} pins={pins} />
                ))}
              </div>
            )}
          </section>
        </FadeUp>
      </div>
    </PageEntrance>
  );
}