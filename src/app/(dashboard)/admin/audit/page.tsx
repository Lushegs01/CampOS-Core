"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, Filter, Download, ChevronLeft, ChevronRight } from "lucide-react";

const auditLogs = [
  { id: "1", userName: "Dr. Sarah Johnson", action: "CREATE", resource: "student", resourceId: "STU-001", status: "success", timestamp: "2024-01-15 10:30:00", ipAddress: "192.168.1.100" },
  { id: "2", userName: "Admin System", action: "UPDATE", resource: "attendance", resourceId: "ATT-2024-001", status: "success", timestamp: "2024-01-15 10:15:00", ipAddress: "192.168.1.1" },
  { id: "3", userName: "Prof. Michael Chen", action: "DELETE", resource: "grade", resourceId: "GRD-045", status: "failure", timestamp: "2024-01-15 09:45:00", ipAddress: "192.168.1.102" },
  { id: "4", userName: "Student Affairs", action: "CREATE", resource: "housing", resourceId: "HOS-2024-089", status: "success", timestamp: "2024-01-15 09:30:00", ipAddress: "192.168.1.50" },
  { id: "5", userName: "Security System", action: "LOGIN", resource: "user", resourceId: "USR-999", status: "failure", timestamp: "2024-01-15 08:15:00", ipAddress: "10.0.0.45" },
  { id: "6", userName: "John Doe", action: "EXPORT", resource: "report", resourceId: "RPT-2024-01", status: "success", timestamp: "2024-01-14 16:30:00", ipAddress: "192.168.1.200" },
];

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Track all user actions and system events</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-background px-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="EXPORT">Export</option>
          </select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Timestamp</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Action</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Resource</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-accent/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs">{log.timestamp}</td>
                    <td className="py-3 px-4">{log.userName}</td>
                    <td className="py-3 px-4">
                      <Badge variant={log.action === "DELETE" ? "destructive" : log.action === "CREATE" ? "success" : "default"}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{log.resource}</td>
                    <td className="py-3 px-4">
                      <Badge variant={log.status === "success" ? "success" : "destructive"} className="capitalize">
                        {log.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">Showing {filteredLogs.length} of {auditLogs.length} logs</p>
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
