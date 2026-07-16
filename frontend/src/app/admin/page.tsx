"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import {
  AlertTriangle,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  Download,
  Inbox,
  LockKeyhole,
  Palette,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import type { AdminOverview, AdminUserPage, AdminUserSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageEntrance } from "@/components/ui/motion";
import { PopulationGroups } from "./PopulationGroups";


const PAGE_SIZE = 25;
const OVERVIEW_PERMISSION = "admin.overview.read";
const FEEDBACK_PERMISSION = "admin.feedback.read";

type PageState = "loading" | "ready" | "denied" | "error";
type UserFilter = "all" | "verification" | "profile" | "administrators";

const statCards: Array<{
  key: keyof AdminOverview;
  label: string;
  note: string;
  icon: typeof Users;
}> = [
  { key: "total_users", label: "Members", note: "Non-deleted accounts", icon: Users },
  { key: "eligible_users", label: "Eligible", note: "Both checks complete", icon: BadgeCheck },
  { key: "completed_profiles", label: "Profiles", note: "Setup complete", icon: FileCheck2 },
  { key: "recent_users_30d", label: "New / 30d", note: "Recent registrations", icon: UserRound },
];

const filters: Array<{ id: UserFilter; label: string }> = [
  { id: "all", label: "All records" },
  { id: "verification", label: "Needs verification" },
  { id: "profile", label: "Profile incomplete" },
  { id: "administrators", label: "Administrators" },
];

function statusCode(error: unknown) {
  return error instanceof AxiosError ? error.response?.status : undefined;
}

function isEligible(user: AdminUserSummary) {
  return user.email_verified && user.is_verified;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<PageState>("loading");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserPage | null>(null);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<UserFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login?next=/admin");
      return;
    }

    let cancelled = false;
    setState("loading");
    Promise.all([adminApi.getOverview(), adminApi.getUsers(page, PAGE_SIZE)])
      .then(([overviewData, userData]) => {
        if (cancelled) return;
        setOverview(overviewData);
        setUsers(userData);
        setSelectedUser(null);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const status = statusCode(error);
        if (status === 401) {
          router.replace("/auth/login?next=/admin");
        } else if (status === 403) {
          setState("denied");
        } else {
          setState("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, page, reloadKey, router, user]);

  if (authLoading || state === "loading") return <AdminLoading />;

  if (state === "denied") {
    return (
      <CenteredState
        eyebrow="403 / Access denied"
        title="This desk is restricted."
        body="Your account is signed in, but it does not have administrative read permission."
      />
    );
  }

  if (state === "error" || !overview || !users) {
    return (
      <CenteredState
        eyebrow="Admin / Unavailable"
        title="The dashboard could not be loaded."
        body="No administrative data was displayed. Try the request again when the service is available."
        action={<Button onClick={() => setReloadKey((value) => value + 1)}>Try again</Button>}
      />
    );
  }

  const currentPageUsers = users.items;
  const needsVerification = currentPageUsers.filter((item) => !isEligible(item));
  const incompleteProfiles = currentPageUsers.filter((item) => !item.profile_setup_done);
  const administrators = currentPageUsers.filter((item) => item.roles.length > 0);
  const visibleUsers = currentPageUsers.filter((item) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "verification" && !isEligible(item)) ||
      (filter === "profile" && !item.profile_setup_done) ||
      (filter === "administrators" && item.roles.length > 0);
    const searchable = `${item.first_name} ${item.last_name} ${item.email} ${item.slug} ${item.roles.join(" ")}`.toLowerCase();
    return matchesFilter && (!deferredSearch || searchable.includes(deferredSearch));
  });
  const totalPages = Math.max(1, Math.ceil(users.total / users.page_size));
  const canReadFeedback = (user?.permissions ?? []).includes(FEEDBACK_PERMISSION);
  const hasOverviewPermission = (user?.permissions ?? []).includes(OVERVIEW_PERMISSION);
  const canManageTheme = (user?.permissions ?? []).includes("admin.site_theme.manage");
  const canExportData = (user?.permissions ?? []).includes("admin.data_export.download");

  return (
    <PageEntrance className="admin-light-surface min-h-full bg-[var(--admin-canvas)] text-[#17251d] transition-colors duration-200">
      <div className="border-b border-[#17251d]/15 bg-[#173b2b] text-[#f4f1ea]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center border border-[#d7e8b5]/45 bg-[#213f31]">
              <ShieldCheck className="h-5 w-5 text-[#d7e8b5]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#d7e8b5]">KVIS Connect</p>
              <p className="font-display text-lg font-bold leading-none">Admin operations room</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-2 border border-[#d7e8b5]/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#d7e8b5]">
              <LockKeyhole className="h-3.5 w-3.5" /> API enforced
            </span>
            <span className="border border-white/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/75">
              {hasOverviewPermission ? "Verified admin session" : "Session pending"}
            </span>
            <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white hover:text-[#173b2b]">
              <Link href="/">Exit desk</Link>
            </Button>
            {canManageTheme && <Button asChild className="bg-[#d7e8b5] text-[#173b2b] hover:bg-white"><Link href="/admin/theme"><Palette className="mr-2 h-4 w-4" />Theme control</Link></Button>}
            {canExportData && <Button asChild className="bg-[#d7e8b5] text-[#173b2b] hover:bg-white"><Link href="/admin/export"><Download className="mr-2 h-4 w-4" />Data export</Link></Button>}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:py-12">
        <header className="grid gap-7 border-b border-[#17251d]/15 pb-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#52714f]">Administration / Read only</p>
            <h1 className="mt-3 font-display text-5xl font-black tracking-[-0.055em] md:text-7xl">The network desk.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#536258] md:text-base">
              A private working surface for account health, verification follow-up, and member context. It intentionally contains no user-editing, promotion, deletion, or impersonation controls.
            </p>
          </div>
          <div className="border-l-4 border-[#b6d875] bg-[#e7edda] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#52714f]">Security posture</p>
            <p className="mt-2 text-sm leading-relaxed text-[#243b2b]">
              The interface is supplementary. Every data request is checked again by the backend against your active permissions and verification status.
            </p>
          </div>
        </header>

        <section className="mt-8 grid grid-cols-2 border-l border-t border-[#17251d]/15 lg:grid-cols-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <article key={card.key} className="min-h-40 border-b border-r border-[#17251d]/15 bg-[#faf8f3] p-5 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#657064]">{card.label}</span>
                  <Icon className="h-4 w-4 text-[#52714f]" />
                </div>
                <p className="mt-8 font-display text-4xl font-black tracking-[-0.04em] tabular-nums md:text-5xl">
                  {overview[card.key].toLocaleString()}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-[#657064]">{card.note}</p>
                  <span className="font-mono text-[10px] text-[#8b9487]">0{index + 1}</span>
                </div>
              </article>
            );
          })}
        </section>

        <PopulationGroups className="mt-8" />

        <section className="mt-10 grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="border border-[#17251d]/15 bg-[#faf8f3]">
            <div className="flex flex-col gap-4 border-b border-[#17251d]/15 p-5 md:flex-row md:items-end md:justify-between md:p-6">
              <div>
                <div className="flex items-center gap-2 text-[#52714f]">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em]">Attention queue</span>
                </div>
                <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.04em]">What needs a look</h2>
              </div>
              <p className="max-w-xs text-xs leading-relaxed text-[#657064]">Counts below are derived from the current directory page, not the complete database.</p>
            </div>
            <div className="grid divide-y divide-[#17251d]/15 md:grid-cols-3 md:divide-x md:divide-y-0">
              <AttentionItem
                count={needsVerification.length}
                label="Verification checks"
                description="Accounts missing email or KVIS verification"
                onClick={() => setFilter("verification")}
              />
              <AttentionItem
                count={incompleteProfiles.length}
                label="Profile setup"
                description="Accounts that have not completed setup"
                onClick={() => setFilter("profile")}
              />
              <AttentionItem
                count={administrators.length}
                label="Role assignments"
                description="Active roles visible on this page"
                onClick={() => setFilter("administrators")}
              />
            </div>
          </div>

          <aside className="border border-[#17251d]/15 bg-[#dce7cf] p-5 md:p-6">
            <div className="flex items-center gap-2 text-[#31583c]">
              <ClipboardCheck className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em]">Operating boundary</span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-black tracking-[-0.035em]">Observe. Verify. Escalate.</h2>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[#35503b]">
              <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#52714f]" />User data is minimal and paginated.</li>
              <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#52714f]" />Role assignment remains an audited, out-of-band operation.</li>
              <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#52714f]" />No action here can alter accounts or permissions.</li>
            </ul>
            {canReadFeedback ? (
              <Button asChild className="mt-6 w-full rounded-none bg-[#173b2b] text-white hover:bg-[#28513d]">
                <Link href="/admin/feedback"><Inbox className="mr-2 h-4 w-4" /> Open feedback inbox</Link>
              </Button>
            ) : (
              <div className="mt-6 border border-[#52714f]/25 bg-white/45 px-3 py-3 text-xs text-[#48654d]">Feedback access has not been granted to this administrator.</div>
            )}
          </aside>
        </section>

        <section className="mt-12">
          <div className="flex flex-col gap-5 border-b border-[#17251d]/15 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#52714f]">
                <Users className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em]">Member directory</span>
              </div>
              <h2 className="mt-2 font-display text-4xl font-black tracking-[-0.045em]">Inspect account context.</h2>
            </div>
            <p className="font-mono text-xs tabular-nums text-[#657064]">{users.total.toLocaleString()} records / page {page} of {totalPages}</p>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0">
              <div className="flex flex-col gap-4 border border-[#17251d]/15 bg-[#faf8f3] p-4 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788478]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search this page"
                    className="h-10 w-full border border-[#17251d]/15 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#52714f]"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-[#657064]">
                  <SlidersHorizontal className="h-4 w-4" /> {visibleUsers.length} visible
                </div>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {filters.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={`whitespace-nowrap border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
                      filter === item.id
                        ? "border-[#173b2b] bg-[#173b2b] text-white"
                        : "border-[#17251d]/15 bg-[#faf8f3] text-[#657064] hover:border-[#52714f] hover:text-[#173b2b]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {visibleUsers.length === 0 ? (
                <div className="mt-3 border border-[#17251d]/15 bg-[#faf8f3] px-6 py-16 text-center">
                  <p className="font-display text-2xl font-bold">No matching accounts.</p>
                  <p className="mt-2 text-sm text-[#657064]">Try a different filter or clear the page search.</p>
                </div>
              ) : (
                <div className="mt-3 overflow-x-auto border border-[#17251d]/15 bg-[#faf8f3]">
                  <table className="w-full min-w-[790px] text-left text-sm">
                    <thead className="bg-[#e8e5dc] text-[10px] uppercase tracking-[0.18em] text-[#657064]">
                      <tr>
                        <th className="px-4 py-3 font-bold">Member</th>
                        <th className="px-4 py-3 font-bold">Verification</th>
                        <th className="px-4 py-3 font-bold">Profile</th>
                        <th className="px-4 py-3 font-bold">Roles</th>
                        <th className="px-4 py-3 font-bold">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleUsers.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedUser(item)}
                          className={`cursor-pointer border-t border-[#17251d]/10 transition-colors hover:bg-[#eef2e5] ${selectedUser?.id === item.id ? "bg-[#e0ebd0]" : ""}`}
                        >
                          <td className="px-4 py-4">
                            <p className="font-semibold text-[#1b3022]">{item.first_name} {item.last_name}</p>
                            <p className="mt-1 text-xs text-[#657064]">{item.email}</p>
                          </td>
                          <td className="px-4 py-4"><StatusPair user={item} /></td>
                          <td className="px-4 py-4"><StatusBadge ok={item.profile_setup_done} label={item.profile_setup_done ? "Complete" : "Incomplete"} /></td>
                          <td className="px-4 py-4 text-xs text-[#657064]">{item.roles.length ? item.roles.join(", ") : "Member"}</td>
                          <td className="px-4 py-4 font-mono text-xs tabular-nums text-[#657064]">{new Date(item.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-4">
                <Button variant="outline" className="rounded-none border-[#17251d]/20" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <span className="font-mono text-xs tabular-nums text-[#657064]">{page} / {totalPages}</span>
                <Button variant="outline" className="rounded-none border-[#17251d]/20" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <UserInspectionPanel user={selectedUser} />
          </div>
        </section>
      </main>
    </PageEntrance>
  );
}

function AttentionItem({ count, label, description, onClick }: { count: number; label: string; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="p-5 text-left transition-colors hover:bg-[#eef2e5] md:p-6">
      <p className="font-display text-4xl font-black tracking-[-0.04em] tabular-nums">{count}</p>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-[#35503b]">{label}</p>
      <p className="mt-2 text-xs leading-relaxed text-[#657064]">{description}</p>
    </button>
  );
}

function StatusPair({ user }: { user: AdminUserSummary }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <StatusBadge ok={user.email_verified} label="Email" />
      <StatusBadge ok={user.is_verified} label="KVIS" />
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${ok ? "border-[#8daf75] bg-[#e6f0d9] text-[#35503b]" : "border-[#d5b875] bg-[#f7efd8] text-[#765d22]"}`}>
      {ok ? <BadgeCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />} {label}
    </span>
  );
}

function UserInspectionPanel({ user }: { user: AdminUserSummary | null }) {
  if (!user) {
    return (
      <aside className="border border-dashed border-[#17251d]/25 bg-[#e8e5dc] p-6 xl:sticky xl:top-6 xl:h-fit">
        <UserCheck className="h-5 w-5 text-[#52714f]" />
        <h3 className="mt-4 font-display text-2xl font-black tracking-[-0.035em]">Inspection panel</h3>
        <p className="mt-3 text-sm leading-relaxed text-[#657064]">Select a member in the directory to review the limited account context available to administrators.</p>
      </aside>
    );
  }

  return (
    <aside className="border border-[#17251d]/15 bg-[#faf8f3] xl:sticky xl:top-6 xl:h-fit">
      <div className="flex items-start justify-between border-b border-[#17251d]/15 p-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#52714f]">Selected record</p>
          <h3 className="mt-2 font-display text-2xl font-black tracking-[-0.035em]">{user.first_name} {user.last_name}</h3>
        </div>
        <Link href={`/profile/${user.slug}`} className="grid h-8 w-8 place-items-center border border-[#17251d]/15 text-[#52714f] transition hover:bg-[#e0ebd0]" aria-label={`Open ${user.first_name}'s public profile`}>
          <UserRound className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-5 p-5 text-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#788478]">Email</p>
          <p className="mt-1 break-all text-[#294230]">{user.email}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#788478]">Account checks</p>
          <div className="mt-2 flex flex-wrap gap-1.5"><StatusPair user={user} /><StatusBadge ok={user.profile_setup_done} label="Profile" /></div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#788478]">Assigned roles</p>
          <p className="mt-1 text-[#294230]">{user.roles.length ? user.roles.join(", ") : "No administrative role"}</p>
        </div>
        <div className="border-t border-[#17251d]/10 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#788478]">Read-only boundary</p>
          <p className="mt-2 text-xs leading-relaxed text-[#657064]">Editing account data, resetting credentials, and changing roles are intentionally unavailable in this draft.</p>
        </div>
      </div>
    </aside>
  );
}

function AdminLoading() {
  return (
    <div className="min-h-screen bg-[var(--admin-canvas)] px-4 py-8 md:px-6">
      <div className="mx-auto max-w-7xl">
        <Skeleton className="h-16 w-full rounded-none" />
        <Skeleton className="mt-10 h-20 w-3/4 max-w-2xl rounded-none" />
        <div className="mt-10 grid grid-cols-2 gap-px bg-[#17251d]/15 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-none" />)}
        </div>
        <Skeleton className="mt-10 h-80 w-full rounded-none" />
      </div>
    </div>
  );
}

function CenteredState({ eyebrow, title, body, action }: { eyebrow: string; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--admin-canvas)] px-4 py-16">
      <div className="max-w-xl border-l-4 border-[#52714f] pl-6 md:pl-8">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#52714f]">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#657064] md:text-base">{body}</p>
        <div className="mt-6 flex items-center gap-3">
          {action}
          <Button asChild variant="outline"><Link href="/">Return home</Link></Button>
        </div>
      </div>
    </div>
  );
}
