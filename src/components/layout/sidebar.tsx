"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, GraduationCap, Building2, Bell, BarChart3,
  FileText, Settings, Shield, ChevronLeft, ChevronRight, Users,
  BookOpen, QrCode, Hotel, MessageCircle, LogOut
} from "lucide-react";

interface SidebarProps { isAdmin?: boolean; collapsed?: boolean; onToggle?: () => void; }

const studentNavItems = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/scanmark", label: "ScanMark", icon: QrCode },
  { href: "/student/unireg", label: "UniReg", icon: BookOpen },
  { href: "/student/funaabnb", label: "FunaaBnB", icon: Hotel },
  { href: "/student/nada", label: "NADA", icon: MessageCircle },
];

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/institutions", label: "Institutions", icon: Building2 },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/audit", label: "Audit Logs", icon: Shield },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/files", label: "Files", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ isAdmin = false, collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <aside className={cn("fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col", collapsed ? "w-[72px]" : "w-[260px]")}>
      <div className="flex items-center h-16 px-4 border-b border-border">
        <Link href={isAdmin ? "/admin" : "/student"} className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <Image src="/logo.png" alt="CampOS Logo" width={32} height={32} className="object-contain" />
          </div>
          {!collapsed && <span className="font-semibold text-lg tracking-tight text-foreground">CampOS</span>}
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all", isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")} title={collapsed ? item.label : undefined}>
              <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
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
