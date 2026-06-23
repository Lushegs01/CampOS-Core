"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { useAnalytics } from "@/hooks/use-analytics";
import {
  Users, TrendingUp, Calendar, Activity, GraduationCap,
  Building2, BarChart3, Download, Plus, ArrowUpRight, ArrowDownRight,
  CheckCircle, XCircle, AlertCircle, Loader2
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const studentGrowthData = [
  { month: "Jan", students: 11000, new: 800 },
  { month: "Feb", students: 11200, new: 600 },
  { month: "Mar", students: 11500, new: 900 },
  { month: "Apr", students: 11800, new: 700 },
  { month: "May", students: 12000, new: 650 },
  { month: "Jun", students: 12200, new: 550 },
  { month: "Jul", students: 12300, new: 400 },
  { month: "Aug", students: 12450, new: 320 },
];

const facultyDistribution = [
  { name: "Science", value: 3200, color: "#0D7377" },
  { name: "Engineering", value: 2800, color: "#14A085" },
  { name: "Arts", value: 2100, color: "#3B9B8A" },
  { name: "Business", value: 1800, color: "#4DAA99" },
  { name: "Medicine", value: 1500, color: "#2C8C7A" },
  { name: "Law", value: 1050, color: "#1E6B5B" },
];

const moduleUsageData = [
  { module: "ScanMark", users: 9800, sessions: 45000 },
  { module: "UniReg", users: 11200, sessions: 28000 },
  { module: "FunaaBnB", users: 6200, sessions: 15000 },
  { module: "NADA", users: 8900, sessions: 52000 },
];

const recentActivity = [
  { id: "1", user: "Dr. Sarah Johnson", action: "Approved course registration", target: "CSC 401", time: "5 mins ago", status: "success" },
  { id: "2", user: "Admin System", action: "Generated attendance report", target: "Science Faculty", time: "15 mins ago", status: "success" },
  { id: "3", user: "Prof. Michael Chen", action: "Updated student grade", target: "MTH 301", time: "1 hour ago", status: "success" },
  { id: "4", user: "Student Affairs", action: "Housing allocation", target: "Hostel B", time: "2 hours ago", status: "warning" },
  { id: "5", user: "Security", action: "Blocked suspicious login", target: "IP 192.168.1.x", time: "3 hours ago", status: "error" },
];

export default function AdminDashboard() {
  const params = useParams();
  const institutionSlug = params.institutionSlug as string;
  const basePath = `/${institutionSlug}`;
  const { user, institution } = useWorkspace();

  const [timeRange, setTimeRange] = useState("30d");
  const { data: analyticsData, isLoading } = useAnalytics(timeRange);

  const stats = analyticsData?.summary || {
    totalStudents: 12450,
    activeStudents: 11200,
    attendanceRate: 87.3,
    housingOccupancy: 78.5,
    nadaActiveUsers: 8900,
    newRegistrations: 3200,
    totalStudentsChange: 5.2,
    attendanceRateChange: -1.3,
    housingOccupancyChange: 3.7,
    newRegistrationsChange: 12.4,
  };

  const quickActions = [
    { label: "Add Student", icon: Plus, color: "bg-emerald-500", href: `${basePath}/admin/students` },
    { label: "Send Notification", icon: Activity, color: "bg-blue-500", href: `${basePath}/admin/notifications` },
    { label: "Generate Report", icon: BarChart3, color: "bg-violet-500", href: `${basePath}/admin/analytics` },
    { label: "Export Data", icon: Download, color: "bg-amber-500", href: "#" },
  ];

  const StatCard = ({ title, value, change, changeLabel, icon: Icon, color }: any) => (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className="flex items-center gap-1">
              {change >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
              <span className={cn("text-sm font-medium", change >= 0 ? "text-emerald-600" : "text-red-600")}>
                {Math.abs(change)}%
              </span>
              <span className="text-sm text-muted-foreground">{changeLabel}</span>
            </div>
          </div>
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {institution?.name || "Admin Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.firstName || "Admin"} • {user?.roles?.[0] || "Administrator"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href}>
              <Button variant="outline" className="gap-2">
                <div className={cn("h-4 w-4 rounded-sm flex items-center justify-center", action.color)}>
                  <Icon className="h-3 w-3 text-white" />
                </div>
                {action.label}
              </Button>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents.toLocaleString()} change={stats.totalStudentsChange} changeLabel="vs last month" icon={Users} color="bg-emerald-500" />
        <StatCard title="Attendance Rate" value={`${stats.attendanceRate}%`} change={stats.attendanceRateChange} changeLabel="vs last week" icon={Calendar} color="bg-blue-500" />
        <StatCard title="Housing Occupancy" value={`${stats.housingOccupancy}%`} change={stats.housingOccupancyChange} changeLabel="vs last month" icon={Building2} color="bg-amber-500" />
        <StatCard title="New Registrations" value={stats.newRegistrations.toLocaleString()} change={stats.newRegistrationsChange} changeLabel="vs last year" icon={GraduationCap} color="bg-violet-500" />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Growth</CardTitle>
            <CardDescription>Total students and new enrollments over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studentGrowthData}>
                  <defs>
                    <linearGradient id="studentsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D7377" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0D7377" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="students" stroke="#0D7377" fill="url(#studentsGrad)" strokeWidth={2} />
                  <Bar dataKey="new" fill="#14A085" radius={[4, 4, 0, 0]} barSize={20} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faculty Distribution</CardTitle>
            <CardDescription>Students by faculty</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={facultyDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {facultyDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Module Usage</CardTitle>
            <CardDescription>Active users and sessions by module</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleUsageData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="module" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="users" fill="#0D7377" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="sessions" fill="#14A085" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions across the platform</CardDescription>
            </div>
            <Link href={`${basePath}/admin/audit`}>
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                    activity.status === "success" && "bg-emerald-500/10",
                    activity.status === "warning" && "bg-amber-500/10",
                    activity.status === "error" && "bg-red-500/10"
                  )}>
                    {activity.status === "success" && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                    {activity.status === "warning" && <AlertCircle className="h-4 w-4 text-amber-600" />}
                    {activity.status === "error" && <XCircle className="h-4 w-4 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.user} • {activity.target}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
