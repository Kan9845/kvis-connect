import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/cache/getQueryClient";
import { keys } from "@/lib/cache/keys";
import { blogApi } from "@/lib/api";
import BlogClient from "./BlogClient";


export default async function BlogPage() {
  const qc = getQueryClient();
  await qc.prefetchQuery({
    queryKey: keys.blog.list({ limit: 100 }),
    queryFn: () => blogApi.list({ limit: 100 }),
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <BlogClient />
    </HydrationBoundary>
  );
}
