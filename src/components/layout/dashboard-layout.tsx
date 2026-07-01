"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/providers/workspace-provider";

interface DashboardLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  institutionSlug?: string;
}

export function DashboardLayout({ children, isAdmin = false, institutionSlug }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, institution } = useWorkspace();

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isAdmin={isAdmin}
        institutionSlug={institutionSlug}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className={cn("transition-all duration-300", sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]")}>
        <TopBar 
          onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          institutionSlug={institutionSlug}
          user={user ? {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            avatarUrl: user.avatarUrl,
            roles: user.roles,
            institutionName: institution?.name,
          } : undefined}
        />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
