"use client";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Search,
  Newspaper,
  BarChart2,
  Users,
  User,
  LogOut,
  Settings,
  Sun,
  Moon,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { keys } from "@/lib/cache/keys";
import type { GlobePin } from "@/lib/types";
import { useNavbarVariant } from "@/contexts/NavbarVariantContext";

function AlumniSearch({
  solid = false,
  dark = false,
}: {
  solid?: boolean;
  dark?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data: pins = [] } = useQuery({
    queryKey: keys.globe.pins(),
    queryFn: userApi.getGlobePins,
    staleTime: 5 * 60 * 1000,
  });

  const results: GlobePin[] =
    query.trim().length === 0
      ? []
      : pins
          .filter((p) => {
            const q = query.toLowerCase();
            const name = `${p.first_name} ${p.last_name}`.toLowerCase();
            return (
              name.includes(q) ||
              p.country?.toLowerCase().includes(q) ||
              p.current_job?.toLowerCase().includes(q)
            );
          })
          .slice(0, 8);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={wrapRef} className="relative flex-1">
      <div className="flex items-center gap-2 px-4">
        <Search
          className={`h-4 w-4 shrink-0 ${dark ? "text-white/70" : "text-muted-foreground"}`}
        />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search alumni..."
          className={`flex-1 py-2.5 text-sm bg-transparent outline-none w-full ${dark ? "text-white placeholder:text-white/60" : "text-foreground placeholder:text-muted-foreground"}`}
        />
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden bg-popover text-popover-foreground border border-border"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)", zIndex: 999 }}
        >
          {results.map((p) => (
            <button
              key={p.user_id}
              onMouseDown={() => {
                router.push(`/profile/${p.slug}`);
                setOpen(false);
                setQuery("");
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 transition-all text-left group hover:bg-accent hover:text-accent-foreground"
            >
              <div
                className="w-8 h-8 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "#1e3a5f", border: "2px solid #3b82f6" }}
              >
                {p.profile_pic_url ? (
                  <img
                    src={p.profile_pic_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  `${p.first_name[0]}${p.last_name[0]}`
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground transition-colors truncate">
                  {p.first_name} {p.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {[p.current_job, p.country].filter(Boolean).join(" · ")}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ThemeToggle({ dark }: { dark: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={`pointer-events-auto h-9 w-9 rounded-full ${
        dark
          ? "text-white hover:bg-white/10 hover:text-white"
          : "text-foreground hover:bg-muted"
      }`}
      aria-label="Toggle theme"
    >
      {mounted ? (
        resolvedTheme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        <Moon className="h-4 w-4 opacity-0" />
      )}
    </Button>
  );
}

const PURPLE = "oklch(44% 0.26 294)";

const NAV_LINKS = [
  { href: "/blog", icon: Newspaper, label: "Blog" },
  { href: "/stats", icon: BarChart2, label: "Stats" },
  { href: "/kvisian", icon: Users, label: "Kvisian" },
] as const;

function NavLink({
  href,
  icon: Icon,
  label,
  pathname,
  dark,
  isActive,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  pathname: string;
  dark: boolean;
  isActive?: boolean;
}) {
  const active =
    isActive ?? (pathname === href || pathname.startsWith(href + "/"));
  const base =
    "flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm transition-colors whitespace-nowrap w-28";

  let cls: string;
  let style: React.CSSProperties = {};
  if (dark) {
    cls = active
      ? "text-white font-semibold"
      : "text-white/90 hover:text-white font-medium";
    if (active) style.boxShadow = "inset 0 -2px 0 0 rgba(255,255,255,0.9)";
  } else {
    cls = active
      ? "font-semibold"
      : "text-muted-foreground hover:text-foreground font-medium";
    if (active) {
      style.color = PURPLE;
      style.boxShadow = `inset 0 -2px 0 0 ${PURPLE}`;
    }
  }

  return (
    <Link href={href} className={`${base} ${cls}`} style={style}>
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}

type PanelUser = {
  first_name: string;
  last_name: string;
  email: string;
  slug: string;
  profile_pic_url?: string | null;
  is_verified?: boolean;
};

function PanelDivider({ dark }: { dark: boolean }) {
  return (
    <div
      style={{
        height: "1px",
        background: dark ? "rgba(255,255,255,0.09)" : "oklch(88% 0.008 294)",
        margin: "4px 16px",
      }}
    />
  );
}

function MobileNavPanel({
  dark,
  pathname,
  user,
  logout,
  onClose,
}: {
  dark: boolean;
  pathname: string;
  user: PanelUser | null;
  logout: () => void;
  onClose: () => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rowColor = dark ? "rgba(255,255,255,0.72)" : "oklch(32% 0.012 294)";

  return (
    <div
      className="pointer-events-auto"
      style={{
        background: dark ? "rgba(5, 2, 16, 0.96)" : "rgba(254, 253, 255, 0.98)",
        backdropFilter: "blur(24px)",
        borderBottom: dark
          ? "1px solid rgba(255,255,255,0.05)"
          : "1px solid oklch(90% 0.007 294)",
      }}
    >
      {/* Panel header: Logo + X */}
      <div className="flex items-center justify-between px-6 h-16">
        <Link
          href="/"
          className={`font-bold text-lg ${dark ? "text-white" : "text-foreground"}`}
          style={
            dark
              ? { filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }
              : undefined
          }
        >
          KVIS Connect
        </Link>
        <button
          onClick={onClose}
          className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${dark ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"}`}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {/* Search */}
      <div className="px-4 py-2">
        <div
          className="flex items-center rounded-2xl"
          style={{
            background: dark
              ? "rgba(255,255,255,0.07)"
              : "oklch(95% 0.005 294)",
            border: dark
              ? "1px solid rgba(255,255,255,0.13)"
              : "1px solid oklch(88% 0.008 294)",
          }}
        >
          <AlumniSearch dark={dark} />
        </div>
      </div>

      {/* Nav links */}
      <nav className="px-4 py-2 flex flex-col gap-0.5">
        {NAV_LINKS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors"
              style={{
                color: active ? (dark ? "white" : PURPLE) : rowColor,
                background: active
                  ? dark
                    ? "rgba(255,255,255,0.1)"
                    : "oklch(91% 0.02 294)"
                  : "transparent",
                fontWeight: active ? 600 : 500,
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <PanelDivider dark={dark} />

      {/* Theme toggle */}
      <div className="px-4 py-1">
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm transition-colors hover:opacity-80"
          style={{ color: rowColor, fontWeight: 500 }}
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" />
          )}
          {mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </div>

      <PanelDivider dark={dark} />

      {/* User section */}
      {user ? (
        <div className="px-4 pb-4 pt-1 flex flex-col gap-0.5">
          {/* Identity row */}
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar className="h-9 w-9 shrink-0 shadow-sm">
              <AvatarImage
                src={user.profile_pic_url ?? ""}
                alt={user.first_name}
              />
              <AvatarFallback>
                {`${user.first_name[0]}${user.last_name[0]}`.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: dark ? "white" : "oklch(15% 0.01 294)" }}
                >
                  {user.first_name} {user.last_name}
                </p>
                {user.is_verified && (
                  <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />
                )}
              </div>
              <p
                className="text-xs truncate"
                style={{
                  color: dark
                    ? "rgba(255,255,255,0.45)"
                    : "oklch(52% 0.01 294)",
                }}
              >
                {user.email}
              </p>
            </div>
          </div>
          <Link
            href={`/profile/${user.slug}`}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors"
            style={{ color: rowColor, fontWeight: 500 }}
          >
            <User className="h-4 w-4 shrink-0" /> My Profile
          </Link>
          <Link
            href="/profile/edit"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors"
            style={{ color: rowColor, fontWeight: 500 }}
          >
            <Settings className="h-4 w-4 shrink-0" /> Edit Profile
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm transition-colors"
            style={{ color: "oklch(55% 0.2 25)", fontWeight: 500 }}
          >
            <LogOut className="h-4 w-4 shrink-0" /> Log out
          </button>
        </div>
      ) : (
        <div className="px-4 pb-5 pt-1 flex flex-col gap-2">
          <Button
            variant="ghost"
            className="w-full text-sm font-medium"
            style={{
              color: dark ? "rgba(255,255,255,0.8)" : "oklch(32% 0.012 294)",
            }}
            asChild
          >
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button
            className="w-full text-sm font-semibold text-white"
            style={{ background: PURPLE }}
            asChild
          >
            <Link href="/auth/register">Join KVIS Connect</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { variant } = useNavbarVariant();
  const { resolvedTheme } = useTheme();
  const isGlobe = pathname === "/";
  const dark = isGlobe && variant === "dark";
  const isDarkTheme = resolvedTheme === "dark";
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const initials = user
    ? `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase()
    : "";

  const userMenu = (ringClass: string) =>
    user ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`rounded-full outline-none ring-offset-2 ${ringClass}`}
          >
            <Avatar className="h-9 w-9 cursor-pointer shadow-md">
              <AvatarImage
                src={user.profile_pic_url ?? ""}
                alt={user.first_name}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium">
                {user.first_name} {user.last_name}
              </p>
              {user.is_verified && (
                <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/profile/${user.slug}`} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" /> My Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/edit" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" /> Edit Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className="text-red-400 cursor-pointer focus:text-red-400"
          >
            <LogOut className="mr-2 h-4 w-4" /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null;

  if (isGlobe) {
    return (
      <header
        className="absolute top-0 left-0 right-0 z-50 pointer-events-none w-full"
        style={{
          background: "transparent",
          backdropFilter: "none",
        }}
      >
        {/* Top bar — hidden on mobile when panel is open */}
        <div
          className={`${mobileOpen ? "hidden nav:flex" : "flex"} items-center justify-between gap-4 px-6 h-16`}
        >
          <Link
            href="/"
            className="font-bold text-lg pointer-events-auto shrink-0"
            style={{
              color: dark ? "white" : "oklch(12% 0.005 294)",
              filter: dark ? "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" : "none",
            }}
          >
            KVIS Connect
          </Link>

          {/* Desktop nav */}
          <div className="hidden nav:flex items-center gap-3 pointer-events-auto">
            <div
              className="flex items-center rounded-full overflow-visible w-[338px]"
              style={{
                background: dark ? "transparent" : "oklch(95% 0.005 294)",
                border: dark
                  ? "1px solid rgba(255,255,255,0.6)"
                  : "1px solid oklch(88% 0.008 294)",
              }}
            >
              <AlumniSearch dark={dark} />
            </div>
            <div
              className="flex items-center rounded-full overflow-hidden shrink-0"
              style={{
                background: dark ? "transparent" : "oklch(95% 0.005 294)",
                border: dark
                  ? "1px solid rgba(255,255,255,0.6)"
                  : "1px solid oklch(88% 0.008 294)",
              }}
            >
              <NavLink
                href="/blog"
                icon={Newspaper}
                label="Blog"
                pathname={pathname}
                dark={dark}
              />
              <div
                className={`w-px h-4 ${dark ? "bg-white/40" : "bg-gray-200"}`}
              />
              <NavLink
                href="/stats"
                icon={BarChart2}
                label="Stats"
                pathname={pathname}
                dark={dark}
              />
              <div
                className={`w-px h-4 ${dark ? "bg-white/40" : "bg-gray-200"}`}
              />
              <NavLink
                href="/kvisian"
                icon={Users}
                label="Kvisian"
                pathname={pathname}
                dark={dark}
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
            <ThemeToggle dark={dark} />
            {user ? (
              userMenu("focus:ring-2 focus:ring-white/50")
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`hidden nav:inline-flex ${dark ? "text-white hover:text-white hover:bg-white/10" : "text-gray-700"}`}
                  asChild
                >
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button
                  size="sm"
                  className={`hidden nav:inline-flex ${dark ? "bg-transparent text-white border border-white/60 hover:bg-white/10" : "text-white"}`}
                  style={dark ? {} : { background: PURPLE }}
                  asChild
                >
                  <Link href="/auth/register">Join</Link>
                </Button>
              </>
            )}
            {/* Mobile hamburger */}
            <button
              className="nav:hidden pointer-events-auto flex items-center justify-center w-9 h-9 rounded-full transition-colors"
              style={{
                color: dark ? "white" : "oklch(22% 0.18 294)",
                background: mobileOpen
                  ? dark
                    ? "rgba(255,255,255,0.12)"
                    : "oklch(91% 0.02 294)"
                  : "transparent",
                filter: dark
                  ? "drop-shadow(0 1px 2px rgba(0,0,0,0.4))"
                  : "none",
              }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        {mobileOpen && (
          <div className="nav:hidden">
            <MobileNavPanel
              dark={dark}
              pathname={pathname}
              user={user}
              logout={logout}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        )}
      </header>
    );
  }

  return (
    <header className="relative z-50 w-full bg-background">
      <div
        className={`${mobileOpen ? "hidden nav:flex" : "flex"} items-center justify-between gap-4 px-6 h-16`}
      >
        <Link href="/" className="font-bold text-lg shrink-0 text-foreground">
          KVIS Connect
        </Link>

        {/* Desktop nav */}
        <div className="hidden nav:flex items-center gap-3">
          <div className="flex items-center bg-muted/50 border border-border rounded-full overflow-visible w-[338px]">
            <AlumniSearch solid />
          </div>
          <div className="flex items-center bg-muted/50 border border-border rounded-full overflow-hidden shrink-0">
            <NavLink
              href="/blog"
              icon={Newspaper}
              label="Blog"
              pathname={pathname}
              dark={false}
            />
            <div className="w-px h-4 bg-border" />
            <NavLink
              href="/stats"
              icon={BarChart2}
              label="Stats"
              pathname={pathname}
              dark={false}
            />
            <div className="w-px h-4 bg-border" />
            <NavLink
              href="/kvisian"
              icon={Users}
              label="Kvisian"
              pathname={pathname}
              dark={false}
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ThemeToggle dark={false} />
          {user ? (
            userMenu("focus:ring-2 focus:ring-blue-200")
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="hidden nav:inline-flex text-muted-foreground"
                asChild
              >
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button
                size="sm"
                className="hidden nav:inline-flex text-white"
                style={{ background: PURPLE }}
                asChild
              >
                <Link href="/auth/register">Join</Link>
              </Button>
            </>
          )}
          {/* Mobile hamburger */}
          <button
            className="nav:hidden flex items-center justify-center w-9 h-9 rounded-full transition-colors text-foreground hover:bg-muted"
            style={{ background: mobileOpen ? undefined : "transparent" }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <MobileNavPanel
          dark={isDarkTheme}
          pathname={pathname}
          user={user}
          logout={logout}
          onClose={() => setMobileOpen(false)}
        />
      )}
    </header>
  );
}
