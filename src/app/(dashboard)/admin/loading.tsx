"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function AdminLoading() {
  return (
    <DashboardLayout isAdmin={true}>
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded-lg w-1/3" />
        <div className="h-4 bg-muted rounded-lg w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-muted rounded-xl" />
          <div className="h-80 bg-muted rounded-xl" />
        </div>
      </div>
    </DashboardLayout>
  );
}
