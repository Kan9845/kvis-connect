"use client";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, BarChart2, Users, User, LogOut, Settings, Sun, Moon, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import type { GlobePin } from "@/lib/types";
import { useNavbarVariant } from "@/contexts/NavbarVariantContext";

function AlumniSearch({ solid = false, dark = false }: { solid?: boolean; dark?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data: pins = [] } = useQuery({
    queryKey: ["globe-pins"],
    queryFn: userApi.getGlobePins,
    staleTime: 5 * 60 * 1000,
  });

  const results: GlobePin[] = query.trim().length === 0 ? [] : pins.filter((p) => {
    const q = query.toLowerCase();
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    return name.includes(q) || p.country?.toLowerCase().includes(q) || p.current_job?.toLowerCase().includes(q);
  }).slice(0, 8);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={wrapRef} className="relative flex-1">
      <div className="flex items-center gap-2 px-4">
        <Search className={`h-4 w-4 shrink-0 ${dark ? "text-white/70" : "text-muted-foreground"}`} />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search alumni..."
          className={`flex-1 py-2.5 text-sm bg-transparent outline-none w-full ${dark ? "text-white placeholder:text-white/60" : "text-foreground placeholder:text-muted-foreground"}`}
        />
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden bg-popover text-popover-foreground border border-border"
          style={{
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            zIndex: 999,
          }}
        >
          {results.map((p) => (
            <button
              key={p.user_id}
              onMouseDown={() => { router.push(`/profile/${p.user_id}`); setOpen(false); setQuery(""); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 transition-all text-left group hover:bg-accent hover:text-accent-foreground"
            >
              <div
                className="w-8 h-8 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "#1e3a5f", border: "2px solid #3b82f6" }}
              >
                {p.profile_pic_url
                  ? <img src={p.profile_pic_url} alt="" className="w-full h-full object-cover" />
                  : `${p.first_name[0]}${p.last_name[0]}`}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground transition-colors truncate">{p.first_name} {p.last_name}</p>
                <p className="text-xs text-muted-foreground truncate">{[p.current_job, p.country].filter(Boolean).join(" · ")}</p>
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
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={`p-2 rounded-full transition-colors pointer-events-auto ${
        dark ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"
      }`}
      aria-label="Toggle theme"
    >
      {mounted
        ? resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
        : <Moon className="h-4 w-4 opacity-0" />}
    </button>
  );
}

const PURPLE = "oklch(44% 0.26 294)";

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
  const active = isActive ?? (pathname === href || pathname.startsWith(href + "/"));
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

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { variant } = useNavbarVariant();
  const isGlobe = pathname === "/";
  const dark = isGlobe && variant === "dark";

  const initials = user
    ? `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase()
    : "";

  const userMenu = (ringClass: string) => user ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`rounded-full outline-none ring-offset-2 ${ringClass}`}>
          <Avatar className="h-9 w-9 cursor-pointer shadow-md">
            <AvatarImage src={user.profile_pic_url ?? ""} alt={user.first_name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
            {user.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/profile/${user.id}`} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" /> My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/edit" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" /> Edit Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  if (isGlobe) {
    return (
      <header
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-6 h-16 pointer-events-none w-full"
        style={{
          background: dark ? "transparent" : "rgba(255,255,255,0.95)",
          backdropFilter: dark ? "none" : "blur(12px)",
          transition: "background 0.3s ease",
        }}
      >
        <Link
          href="/"
          className="font-bold text-lg pointer-events-auto shrink-0"
          style={{ color: dark ? "white" : "oklch(22% 0.18 294)", filter: dark ? "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" : "none" }}
        >
          KVIS Connect
        </Link>

        <div className="flex items-center gap-3 pointer-events-auto">
          <div
            className="flex items-center rounded-full overflow-visible w-[338px]"
            style={{ background: dark ? "transparent" : "oklch(95% 0.005 294)", border: dark ? "1px solid rgba(255,255,255,0.6)" : "1px solid oklch(88% 0.008 294)" }}
          >
            <AlumniSearch dark={dark} />
          </div>
          <div
            className="flex items-center rounded-full overflow-hidden shrink-0"
            style={{ background: dark ? "transparent" : "oklch(95% 0.005 294)", border: dark ? "1px solid rgba(255,255,255,0.6)" : "1px solid oklch(88% 0.008 294)" }}
          >
            <NavLink href="/blog" icon={BookOpen} label="Blog" pathname={pathname} dark={dark} />
            <div className={`w-px h-4 ${dark ? "bg-white/40" : "bg-gray-200"}`} />
            <NavLink href="/stats" icon={BarChart2} label="Stats" pathname={pathname} dark={dark} />
            <div className={`w-px h-4 ${dark ? "bg-white/40" : "bg-gray-200"}`} />
            <NavLink href="/kvisian" icon={Users} label="Kvisian" pathname={pathname} dark={dark} />
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto shrink-0">
          <ThemeToggle dark={dark} />
          {user ? userMenu("focus:ring-2 focus:ring-white/50") : (
            <>
              <Button variant="ghost" size="sm" className={dark ? "text-white hover:text-white hover:bg-white/10" : "text-gray-700"} asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button size="sm" className={dark ? "bg-transparent text-white border border-white/60 hover:bg-white/10" : "text-white"} style={dark ? {} : { background: "oklch(44% 0.26 294)" }} asChild>
                <Link href="/auth/register">Join</Link>
              </Button>
            </>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="relative z-50 flex items-center justify-between gap-4 px-6 h-16 w-full bg-background">
      <Link href="/" className="font-bold text-lg text-foreground shrink-0">
        KVIS Connect
      </Link>
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-muted/50 border border-border rounded-full overflow-visible w-[338px]">
          <AlumniSearch solid />
        </div>
        <div className="flex items-center bg-muted/50 border border-border rounded-full overflow-hidden shrink-0">
          <NavLink href="/blog" icon={BookOpen} label="Blog" pathname={pathname} dark={false} />
          <div className="w-px h-4 bg-border" />
          <NavLink href="/stats" icon={BarChart2} label="Stats" pathname={pathname} dark={false} />
          <div className="w-px h-4 bg-border" />
          <NavLink href="/kvisian" icon={Users} label="Kvisian" pathname={pathname} dark={false} />
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <ThemeToggle dark={false} />
        {user ? userMenu("focus:ring-2 focus:ring-blue-200") : (
          <>
            <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button size="sm" className="text-white" style={{ background: "oklch(44% 0.26 294)" }} asChild>
              <Link href="/auth/register">Join</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
