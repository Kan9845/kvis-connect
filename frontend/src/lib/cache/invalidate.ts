import type { QueryClient } from "@tanstack/react-query";
import type { BlogDetail, UserMe } from "@/lib/types";
import { keys } from "./keys";

export function onBlogMutationSuccess(qc: QueryClient, blog: BlogDetail) {
  qc.setQueryData(keys.blog.detail(blog.slug), blog);
  qc.invalidateQueries({ queryKey: keys.blog.all() });
}

export function onBlogDeleteSuccess(qc: QueryClient, slug: string) {
  qc.removeQueries({ queryKey: keys.blog.detail(slug) });
  qc.invalidateQueries({ queryKey: keys.blog.all() });
}

export function onMeUpdateSuccess(qc: QueryClient, me: UserMe) {
  qc.setQueryData(keys.me(), me);
  qc.setQueryData(keys.user.detail(me.id), me);
  qc.invalidateQueries({ queryKey: keys.user.all() });
  qc.invalidateQueries({ queryKey: keys.globe.pins() });
}
