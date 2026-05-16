"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { searchApi } from "@/lib/api";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SortBar } from "@/components/search/SortBar";
import { UserCard } from "@/components/profile/ProfileCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { SearchParams } from "@/lib/types";

export default function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login?next=/search");
    }
  }, [authLoading, user, router]);

  const [params, setParams] = useState<SearchParams>({});
  const [sort, setSort] = useState<SearchParams["sort"]>("name");
  const [order, setOrder] = useState<SearchParams["order"]>("asc");

  const hasSearch = Object.keys(params).length > 0;

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["search", params, sort, order],
    queryFn: () => searchApi.search({ ...params, sort, order }),
    enabled: hasSearch && !!user,
  });

  if (authLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="flex flex-col lg:flex-row gap-6">
          <Skeleton className="w-full lg:w-72 h-96 rounded-xl shrink-0" />
          <div className="flex-1 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Alumni Directory</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-72 shrink-0">
          <SearchFilters values={params} onChange={setParams} />
        </aside>

        <div className="flex-1 min-w-0">
          {hasSearch ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Searching…" : `${results.length} result${results.length !== 1 ? "s" : ""}`}
                </p>
                <SortBar sort={sort} order={order} onSort={setSort} onOrder={setOrder} />
              </div>

              {isLoading ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">No alumni matched your filters.</div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {results.map((u) => <UserCard key={u.id} user={u} />)}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">Use the filters to search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
