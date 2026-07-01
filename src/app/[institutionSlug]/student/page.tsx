"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { useNotifications } from "@/hooks/use-notifications";
import { useAttendance } from "@/hooks/use-attendance";
import {
  Bell, TrendingUp, Calendar, BookOpen, Hotel, Zap,
  ChevronRight, AppWindow, Loader2
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  QrCode: Calendar, // fallback mapping
  BookOpen,
  Hotel,
  MessageCircle: Bell, // fallback
  AppWindow,
};

function getModuleIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || AppWindow;
}

const colorMap: Record<string, string> = {
  scanmark: "from-emerald-500 to-teal-600",
  unireg: "from-blue-500 to-indigo-600",
  funaabnb: "from-amber-500 to-orange-600",
  nada: "from-violet-500 to-purple-600",
};

const bgColorMap: Record<string, string> = {
  scanmark: "bg-emerald-500/10",
  unireg: "bg-blue-500/10",
  funaabnb: "bg-amber-500/10",
  nada: "bg-violet-500/10",
};

const textColorMap: Record<string, string> = {
  scanmark: "text-emerald-600",
  unireg: "text-blue-600",
  funaabnb: "text-amber-600",
  nada: "text-violet-600",
};

const attendanceData = [
  { day: "Mon", rate: 92 },
  { day: "Tue", rate: 88 },
  { day: "Wed", rate: 95 },
  { day: "Thu", rate: 90 },
  { day: "Fri", rate: 85 },
  { day: "Sat", rate: 70 },
  { day: "Sun", rate: 65 },
];

const notifications = [
  { id: "1", title: "Attendance marked", message: "Your attendance for CSC 301 was recorded", type: "success" as const, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: "2", title: "Course registration open", message: "Registration for 2024/2025 session is now open", type: "info" as const, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: "3", title: "Housing payment due", message: "Your hostel fee payment is due in 3 days", type: "warning" as const, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
];

export default function StudentDashboard() {
  const params = useParams();
  const institutionSlug = params.institutionSlug as string;
  const basePath = `/${institutionSlug}`;
  const { user, modules, institution } = useWorkspace();
  const { data: notificationsData, isLoading: notificationsLoading } = useNotifications();
  const { data: attendance } = useAttendance();

  const attendanceTotal = attendance?.summary?.total ?? 0;
  const attendanceCourses = attendance?.summary?.courses?.length ?? 0;
  const attendanceRecords = attendance?.records ?? [];

  const profileCompletion = 100;

  const displayNotifications = notificationsData || notifications;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName || "Student"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {institution?.name || "Your Institution"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success">Verified</Badge>
          <Badge variant="outline">{user?.roles?.[0] || "Student"}</Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Check-ins</p>
                <p className="text-3xl font-bold mt-1">{attendanceTotal}</p>
                <div className="flex items-center gap-1 mt-1 text-emerald-600 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{attendanceCourses} {attendanceCourses === 1 ? "course" : "courses"}</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Courses</p>
                <p className="text-3xl font-bold mt-1">6</p>
                <div className="flex items-center gap-1 mt-1 text-emerald-600 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>Registered</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Housing</p>
                <p className="text-3xl font-bold mt-1">Hostel B</p>
                <div className="flex items-center gap-1 mt-1 text-amber-600 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>Active</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Hotel className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">NADA Rep</p>
                <p className="text-3xl font-bold mt-1">1,240</p>
                <div className="flex items-center gap-1 mt-1 text-violet-600 text-sm">
                  <Zap className="h-4 w-4" />
                  <span>Top 5%</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Cards & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Your Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modules.map((module) => {
              const Icon = getModuleIcon(module.icon);
              const color = colorMap[module.name] || "from-gray-500 to-slate-600";
              return (
                <Link 
                  key={module.id} 
                  href={`${basePath}/student/${module.name}`}
                >
                  <Card className="card-hover group cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br", color)}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <Badge variant="success" className="text-xs">Active</Badge>
                      </div>
                      <h3 className="font-semibold mt-4">{module.displayName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{module.description || "CampOS Module"}</p>
                      <div className="flex items-center gap-1 mt-4 text-sm text-primary group-hover:underline">
                        <span>Open</span>
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Weekly Attendance</h2>
          <Card>
            <CardContent className="p-6">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceData}>
                    <defs>
                      <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(162, 76%, 22%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(162, 76%, 22%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke="hsl(162, 76%, 22%)"
                      fill="url(#attendanceGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Profile Progress & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Completion</CardTitle>
            <CardDescription>Complete your profile to access all features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{profileCompletion}% Complete</span>
              <span className="text-sm text-muted-foreground">All set!</span>
            </div>
            <Progress value={profileCompletion} className="h-2" />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Personal information</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Academic details</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Email verification</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>ID verification</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Recent updates from your modules</CardDescription>
            </div>
            <Link href={`${basePath}/student/notifications`}>
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {notificationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : displayNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No notifications yet</p>
            ) : (
              displayNotifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                    n.type === "success" && "bg-emerald-500/10",
                    n.type === "info" && "bg-blue-500/10",
                    n.type === "warning" && "bg-amber-500/10",
                    n.type === "error" && "bg-red-500/10"
                  )}>
                    <Bell className={cn(
                      "h-4 w-4",
                      n.type === "success" && "text-emerald-600",
                      n.type === "info" && "text-blue-600",
                      n.type === "warning" && "text-amber-600",
                      n.type === "error" && "text-red-600"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(new Date(n.createdAt))}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance (live from ScanMark) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
          <CardDescription>Check-ins recorded via ScanMark</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No attendance yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Open ScanMark and scan to mark attendance — it shows up here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {attendanceRecords.slice(0, 8).map((rec) => (
                <div key={rec.id} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {rec.courseCode}
                      {rec.courseTitle ? ` · ${rec.courseTitle}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {rec.sessionTitle || "Attendance recorded"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge
                      variant={rec.status === "present" ? "success" : "outline"}
                      className="capitalize"
                    >
                      {rec.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(new Date(rec.scannedAt))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
