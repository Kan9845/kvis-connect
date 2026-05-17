import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/cache/getQueryClient";
import { keys } from "@/lib/cache/keys";
import { blogApi } from "@/lib/api";
import BlogDetailClient from "./BlogDetailClient";

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const qc = getQueryClient();
  await qc.prefetchQuery({
    queryKey: keys.blog.detail(slug),
    queryFn: () => blogApi.get(slug),
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <BlogDetailClient params={params} />
    </HydrationBoundary>
  );
}
