"use client";

import { useState } from "react";
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

interface SidebarProps { isAdmin?: boolean; institutionSlug?: string; collapsed?: boolean; onToggle?: () => void; }

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

export function Sidebar({ isAdmin = false, institutionSlug, collapsed = false, onToggle }: SidebarProps) {
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

  return (
    <aside className={cn("fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col", collapsed ? "w-[72px]" : "w-[260px]")}>
      <div className="flex items-center h-16 px-4 border-b border-border">
        <Link href={isAdmin ? `${basePath}/admin` : `${basePath}/student`} className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <Image src="/logo.png" alt="CampOS Logo" width={32} height={32} className="object-contain" unoptimized />
          </div>
          {!collapsed && <span className="font-semibold text-lg tracking-tight text-foreground">CampOS</span>}
        </Link>
      </div>
      {!collapsed && institution && (
        <div className="px-4 py-2 border-b border-border">
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
              {!collapsed && <span>{item.label}</span>}
            </>
          );
          // External modules go through the SSO hand-off, which 302s to another
          // origin — use a plain <a> (full navigation), not a client-side <Link>.
          return item.external ? (
            <a key={item.href} href={item.href} className={linkClass} title={collapsed ? item.label : undefined}>
              {inner}
            </a>
          ) : (
            <Link key={item.href} href={item.href} className={linkClass} title={collapsed ? item.label : undefined}>
              {inner}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <button onClick={onToggle} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all w-full">
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
        <Link href="/api/auth/logout" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all mt-1">
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sign out</span>}
        </Link>
      </div>
    </aside>
  );
}
