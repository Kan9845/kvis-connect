import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/cache/getQueryClient";
import { keys } from "@/lib/cache/keys";
import { userApi } from "@/lib/api";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const slug = params.id;
  const qc = getQueryClient();
  await qc.prefetchQuery({
    queryKey: keys.user.detail(slug),
    queryFn: () => userApi.getUser(slug),
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ProfileClient params={params} />
    </HydrationBoundary>
  );
}
