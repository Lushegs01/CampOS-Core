"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import { useStudents } from "@/hooks/use-students";
import { Search, Filter, Download, ChevronLeft, ChevronRight, MoreHorizontal, Loader2 } from "lucide-react";

const mockStudents = [
  { id: "1", firstName: "John", lastName: "Doe", matricNumber: "UNI/2020/001", faculty: "Science", department: "Computer Science", level: "400", status: "active", email: "john.doe@university.edu" },
  { id: "2", firstName: "Jane", lastName: "Smith", matricNumber: "UNI/2020/002", faculty: "Science", department: "Mathematics", level: "400", status: "active", email: "jane.smith@university.edu" },
  { id: "3", firstName: "Michael", lastName: "Chen", matricNumber: "UNI/2020/003", faculty: "Engineering", department: "Electrical Engineering", level: "300", status: "active", email: "michael.chen@university.edu" },
  { id: "4", firstName: "Sarah", lastName: "Johnson", matricNumber: "UNI/2020/004", faculty: "Medicine", department: "Medicine", level: "500", status: "active", email: "sarah.johnson@university.edu" },
  { id: "5", firstName: "David", lastName: "Adeleke", matricNumber: "UNI/2020/005", faculty: "Business", department: "Accounting", level: "400", status: "suspended", email: "david.adeleke@university.edu" },
  { id: "6", firstName: "Emily", lastName: "Wang", matricNumber: "UNI/2020/006", faculty: "Arts", department: "English", level: "300", status: "active", email: "emily.wang@university.edu" },
  { id: "7", firstName: "Robert", lastName: "Brown", matricNumber: "UNI/2020/007", faculty: "Law", department: "Law", level: "400", status: "graduated", email: "robert.brown@university.edu" },
];

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: studentsData, isLoading } = useStudents(search, statusFilter === "all" ? undefined : statusFilter);

  const students = studentsData || mockStudents;

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !search ||
      s.firstName.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName.toLowerCase().includes(search.toLowerCase()) ||
      (s.matricNumber && s.matricNumber.toLowerCase().includes(search.toLowerCase())) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">Manage student records and enrollment</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button variant="gradient">Add Student</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="graduated">Graduated</option>
          </select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Matric No</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Faculty</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Level</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{getInitials(`${student.firstName} ${student.lastName}`)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{student.matricNumber || "—"}</td>
                      <td className="py-3 px-4">{student.faculty || "—"}</td>
                      <td className="py-3 px-4">{student.department || "—"}</td>
                      <td className="py-3 px-4">{student.level || "—"}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            student.status === "active"
                              ? "success"
                              : student.status === "suspended"
                              ? "warning"
                              : "default"
                          }
                          className="capitalize"
                        >
                          {student.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">Showing {filteredStudents.length} of {students.length} students</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
