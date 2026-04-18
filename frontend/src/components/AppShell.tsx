import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sprout,
  Users,
  LogOut,
  Menu,
  X,
  WifiOff,
  CloudUpload,
  User as UserIcon,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useOfflineQueueStore } from "@/stores/offlineQueueStore";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNav: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/fields", label: "Fields", icon: Sprout },
  { to: "/admin/users", label: "Users", icon: Users },
];

const agentNav: NavItem[] = [
  { to: "/agent/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agent/fields", label: "My Fields", icon: Sprout },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const queue = useOfflineQueueStore((s) => s.queue);
  const online = useOnlineStatus();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const nav = role === "ADMIN" ? adminNav : agentNav;

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <SidebarContent nav={nav} pathname={location.pathname} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex w-64 flex-col bg-sidebar text-sidebar-foreground">
            <SidebarContent
              nav={nav}
              pathname={location.pathname}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-card/80 px-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              {role === "ADMIN" ? "Coordinator" : "Field Agent"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!online && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning-foreground">
                <WifiOff className="h-3.5 w-3.5" /> Offline
              </span>
            )}
            {queue.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
                <CloudUpload className="h-3.5 w-3.5" /> {queue.length} queued
              </span>
            )}
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="text-right text-xs leading-tight">
                <div className="font-medium text-foreground">
                  {user?.fullName ?? user?.email ?? "—"}
                </div>
                <div className="text-muted-foreground">{user?.email}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="min-h-0 flex-1 px-3 py-4 md:px-6 md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  nav,
  pathname,
  onNavigate,
}: {
  nav: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-sidebar-foreground"
          onClick={onNavigate}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="text-base font-semibold tracking-tight">
            SmartSeason
          </span>
        </Link>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="text-sidebar-foreground md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/60">
        <p>Built for low-bandwidth field work.</p>
      </div>
    </>
  );
}
