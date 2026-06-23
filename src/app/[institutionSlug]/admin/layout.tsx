"use client";

import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function AdminWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const institutionSlug = params.institutionSlug as string;

  return <DashboardLayout isAdmin={true} institutionSlug={institutionSlug}>{children}</DashboardLayout>;
}
