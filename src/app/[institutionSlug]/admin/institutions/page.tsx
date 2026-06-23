"use client";

import { useInstitutions } from "@/hooks/use-institutions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, ChevronRight, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const mockInstitutions = [
  { id: "1", name: "Demo University", code: "DEMO", slug: "demo-university", country: "Nigeria", city: "Lagos", students: 12450, faculties: 4, isActive: true },
  { id: "2", name: "Tech Institute", code: "TECH", slug: "tech-institute", country: "Nigeria", city: "Abuja", students: 8500, faculties: 3, isActive: true },
  { id: "3", name: "Liberal Arts College", code: "LAC", slug: "liberal-arts", country: "Nigeria", city: "Ibadan", students: 3200, faculties: 2, isActive: false },
];

export default function InstitutionsPage() {
  const params = useParams();
  const institutionSlug = params.institutionSlug as string;
  const { data: institutionsData, isLoading } = useInstitutions();
  const institutions = institutionsData || mockInstitutions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Institutions</h1>
          <p className="text-muted-foreground mt-1">Manage institutions and their configurations</p>
        </div>
        <Button variant="gradient" className="gap-2">
          <Plus className="h-4 w-4" /> Add Institution
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {institutions.map((institution) => (
            <Card key={institution.id} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant={institution.isActive ? "success" : "default"}>
                    {institution.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold mt-4">{institution.name}</h3>
                <p className="text-sm text-muted-foreground">{institution.city}, {institution.country}</p>
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{institution.students.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{institution.faculties} Faculties</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link href={`/${institutionSlug}/admin/institutions/${institution.id}`}>
                    <Button variant="ghost" className="w-full justify-between text-primary">
                      Manage <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
