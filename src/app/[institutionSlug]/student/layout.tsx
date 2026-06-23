"use client";

import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function StudentWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const institutionSlug = params.institutionSlug as string;

  return <DashboardLayout isAdmin={false} institutionSlug={institutionSlug}>{children}</DashboardLayout>;
}
