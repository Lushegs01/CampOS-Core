"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import {
  QrCode, BookOpen, Hotel, MessageCircle, Bell, TrendingUp, TrendingDown,
  Calendar, Clock, Award, Zap, Users, ChevronRight, Activity
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface StudentData {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  studentProfile: {
    camposId: string;
    matricNumber: string;
    level: string;
    enrollmentStatus: string;
    verificationStatus: string;
    faculty: string;
    department: string;
  } | null;
  unreadNotifications: number;
}

const modules = [
  {
    id: "scanmark",
    name: "ScanMark",
    description: "Attendance verification via QR code scanning",
    icon: QrCode,
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-600",
    status: "Active",
    url: "https://scanmark-funaab.onrender.com/",
  },
  {
    id: "unireg",
    name: "UniReg",
    description: "Course registration and academic records",
    icon: BookOpen,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600",
    status: "Active",
    url: "/dashboard/student/unireg",
  },
  {
    id: "funaabnb",
    name: "FunaaBnB",
    description: "Student accommodation and housing",
    icon: Hotel,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-600",
    status: "Active",
    url: "/dashboard/student/funaabnb",
  },
  {
    id: "nada",
    name: "NADA",
    description: "Anonymous student social network",
    icon: MessageCircle,
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-500/10",
    textColor: "text-violet-600",
    status: "Active",
    url: "/dashboard/student/nada",
  },
];

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
  { id: "1", title: "Attendance marked", message: "Your attendance for CSC 301 was recorded", type: "success" as const, time: new Date(Date.now() - 1000 * 60 * 30) },
  { id: "2", title: "Course registration open", message: "Registration for 2024/2025 session is now open", type: "info" as const, time: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  { id: "3", title: "Housing payment due", message: "Your hostel fee payment is due in 3 days", type: "warning" as const, time: new Date(Date.now() - 1000 * 60 * 60 * 5) },
];

const activities = [
  { id: "1", action: "Checked in via ScanMark", module: "ScanMark", time: "10 mins ago" },
  { id: "2", action: "Registered for CSC 401", module: "UniReg", time: "2 hours ago" },
  { id: "3", action: "Applied for Hostel B", module: "FunaaBnB", time: "1 day ago" },
  { id: "4", action: "Posted in NADA", module: "NADA", time: "2 days ago" },
];

export default function StudentDashboard() {
  const [user, setUser] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setUser({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@university.edu",
        studentProfile: {
          camposId: "CP-ABC123XYZ",
          matricNumber: "UNI/2020/001",
          level: "400",
          enrollmentStatus: "active",
          verificationStatus: "verified",
          faculty: "Science",
          department: "Computer Science",
        },
        unreadNotifications: 3,
      });
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const profile = user?.studentProfile;
  const profileCompletion = profile?.verificationStatus === "verified" ? 100 : 75;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            {profile?.faculty} • {profile?.department} • Level {profile?.level}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={profile?.verificationStatus === "verified" ? "success" : "warning"}>
            {profile?.verificationStatus === "verified" ? "Verified" : "Pending Verification"}
          </Badge>
          <Badge variant="outline">{profile?.camposId}</Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-3xl font-bold mt-1">92%</p>
                <div className="flex items-center gap-1 mt-1 text-emerald-600 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>+3.2%</span>
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
                  <Clock className="h-4 w-4" />
                  <span>Payment Due</span>
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
                  <Award className="h-4 w-4" />
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
              const Icon = module.icon;
              return (
                <Link 
                  key={module.id} 
                  href={module.url}
                  target={module.url.startsWith("http") ? "_blank" : undefined}
                  rel={module.url.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  <Card className="card-hover group cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br", module.color)}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <Badge variant="success" className="text-xs">{module.status}</Badge>
                      </div>
                      <h3 className="font-semibold mt-4">{module.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
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
              <span className="text-sm text-muted-foreground">
                {profileCompletion === 100 ? "All set!" : "2 items remaining"}
              </span>
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
                <div className={cn("h-2 w-2 rounded-full", profileCompletion === 100 ? "bg-emerald-500" : "bg-muted")} />
                <span className={profileCompletion === 100 ? "" : "text-muted-foreground"}>ID verification</span>
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
            <Link href="/dashboard/notifications">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                  n.type === "success" && "bg-emerald-500/10",
                  n.type === "info" && "bg-blue-500/10",
                  n.type === "warning" && "bg-amber-500/10"
                )}>
                  <Bell className={cn(
                    "h-4 w-4",
                    n.type === "success" && "text-emerald-600",
                    n.type === "info" && "text-blue-600",
                    n.type === "warning" && "text-amber-600"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(n.time)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest actions across CampOS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.module}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
