"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/providers/workspace-provider";
import {
  LayoutDashboard, Building2, Bell, BarChart3,
  FileText, Settings, Shield, ChevronLeft, ChevronRight, Users,
  BookOpen, QrCode, Hotel, MessageCircle, LogOut,
  AppWindow, // fallback icon
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SidebarProps {
  isAdmin?: boolean;
  institutionSlug?: string;
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Building2,
  Bell,
  BarChart3,
  FileText,
  Settings,
  Shield,
  Users,
  BookOpen,
  QrCode,
  Hotel,
  MessageCircle,
  AppWindow,
};

function getIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || AppWindow;
}

export function Sidebar({
  isAdmin = false,
  institutionSlug,
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const basePath = institutionSlug ? `/${institutionSlug}` : "";
  const { modules, institution } = useWorkspace();

  // Build admin nav items (always static, all internal)
  const adminNavItems = [
    { href: `${basePath}/admin`, label: "Dashboard", icon: LayoutDashboard },
    { href: `${basePath}/admin/students`, label: "Students", icon: Users },
    { href: `${basePath}/admin/institutions`, label: "Institutions", icon: Building2 },
    { href: `${basePath}/admin/analytics`, label: "Analytics", icon: BarChart3 },
    { href: `${basePath}/admin/audit`, label: "Audit Logs", icon: Shield },
    { href: `${basePath}/admin/notifications`, label: "Notifications", icon: Bell },
    { href: `${basePath}/admin/files`, label: "Files", icon: FileText },
    { href: `${basePath}/admin/settings`, label: "Settings", icon: Settings },
  ].map((item) => ({ ...item, external: false }));

  // Build student nav items from registered modules.
  // A module whose registered URL is absolute (e.g. ScanMark on Render) is an
  // external app: link it through the SSO hand-off so the student lands there
  // already authenticated. Internal modules keep their in-app page.
  const studentNavItems = [
    { href: `${basePath}/student`, label: "Dashboard", icon: LayoutDashboard, external: false },
    ...modules.map((m) => {
      const isExternal = /^https?:\/\//i.test(m.url);
      return {
        href: isExternal
          ? `/api/modules/sso?module=${encodeURIComponent(m.name)}`
          : `${basePath}/student/${m.name}`,
        label: m.displayName,
        icon: getIcon(m.icon),
        external: isExternal,
      };
    }),
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  // Label visibility: always shown in the mobile drawer; on desktop, hidden
  // only when the sidebar is collapsed.
  const labelClass = cn(collapsed && "lg:hidden");

  return (
    <>
      {/* Mobile backdrop — tap to close the drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col w-[260px]",
          collapsed ? "lg:w-[72px]" : "lg:w-[260px]",
          mobileOpen ? "translate-x-0 shadow-2xl lg:shadow-none" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="flex items-center h-16 px-4 border-b border-border">
          <Link
            href={isAdmin ? `${basePath}/admin` : `${basePath}/student`}
            className="flex items-center gap-3"
            onClick={onMobileClose}
          >
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              <Image src="/logo.png" alt="CampOS Logo" width={32} height={32} className="object-contain" unoptimized />
            </div>
            <span className={cn("font-semibold text-lg tracking-tight text-foreground", labelClass)}>CampOS</span>
          </Link>
        </div>
        {institution && (
          <div className={cn("px-4 py-2 border-b border-border", labelClass)}>
            <p className="text-xs text-muted-foreground truncate">{institution.name}</p>
          </div>
        )}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = !item.external && pathname === item.href;
            const Icon = item.icon;
            const linkClass = cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all", isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground");
            const inner = (
              <>
                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
                <span className={labelClass}>{item.label}</span>
              </>
            );
            // External modules go through the SSO hand-off, which 302s to another
            // origin — use a plain <a> (full navigation), not a client-side <Link>.
            return item.external ? (
              <a key={item.href} href={item.href} onClick={onMobileClose} className={linkClass} title={collapsed ? item.label : undefined}>
                {inner}
              </a>
            ) : (
              <Link key={item.href} href={item.href} onClick={onMobileClose} className={linkClass} title={collapsed ? item.label : undefined}>
                {inner}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          {/* Collapse is a desktop affordance; on mobile the drawer closes via backdrop. */}
          <button onClick={onToggle} className="hidden lg:flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all w-full">
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            <span className={labelClass}>Collapse</span>
          </button>
          <button
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
              } catch {}
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all mt-1 w-full"
            title={collapsed ? "Sign out" : undefined}
          >
            <LogOut className="h-5 w-5" />
            <span className={labelClass}>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
