"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UniRegPage() {
  const courses = [
    { code: "CSC 401", title: "Software Engineering", credits: 3, status: "registered", lecturer: "Dr. Johnson" },
    { code: "CSC 403", title: "Database Systems II", credits: 3, status: "registered", lecturer: "Prof. Smith" },
    { code: "MTH 401", title: "Numerical Analysis", credits: 3, status: "registered", lecturer: "Dr. Chen" },
    { code: "CSC 405", title: "Computer Networks", credits: 3, status: "pending", lecturer: "Dr. Williams" },
    { code: "GNS 401", title: "Use of English IV", credits: 2, status: "registered", lecturer: "Mrs. Adeleke" },
  ];

  const totalCredits = courses.filter(c => c.status === "registered").reduce((sum, c) => sum + c.credits, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">UniReg</h1>
          <p className="text-muted-foreground mt-1">Student Registration & Academic Administration</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline">{totalCredits} Credits</Badge>
          <Button variant="gradient">Register Courses</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CGPA</p>
                <p className="text-3xl font-bold">4.52</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Courses</p>
                <p className="text-3xl font-bold">5</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-3xl font-bold">Active</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Courses</CardTitle>
          <CardDescription>2024/2025 Academic Session - First Semester</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {courses.map((course, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    course.status === "registered" ? "bg-emerald-500/10" : "bg-amber-500/10"
                  )}>
                    {course.status === "registered" ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{course.code}</p>
                    <p className="text-sm text-muted-foreground">{course.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">{course.credits} Credits</p>
                  <p className="text-xs text-muted-foreground">{course.lecturer}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
