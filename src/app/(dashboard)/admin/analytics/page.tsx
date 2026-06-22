"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Calendar, ArrowUpRight, ArrowDownRight, TrendingUp, Users, GraduationCap, Building2, Hotel, MessageCircle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const dailyData = [
  { date: "Mon", students: 12000, attendance: 85, housing: 78, nada: 3200 },
  { date: "Tue", students: 12100, attendance: 88, housing: 79, nada: 3400 },
  { date: "Wed", students: 12200, attendance: 90, housing: 80, nada: 3600 },
  { date: "Thu", students: 12250, attendance: 87, housing: 79, nada: 3500 },
  { date: "Fri", students: 12300, attendance: 84, housing: 78, nada: 3800 },
  { date: "Sat", students: 12300, attendance: 65, housing: 77, nada: 4200 },
  { date: "Sun", students: 12300, attendance: 60, housing: 77, nada: 4500 },
];

const moduleBreakdown = [
  { name: "ScanMark", users: 9800, growth: 5.2 },
  { name: "UniReg", users: 11200, growth: 3.8 },
  { name: "FunaaBnB", users: 6200, growth: -1.2 },
  { name: "NADA", users: 8900, growth: 12.4 },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState("30d");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Detailed insights and metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={range === "7d" ? "default" : "outline"} size="sm" onClick={() => setRange("7d")}>7D</Button>
          <Button variant={range === "30d" ? "default" : "outline"} size="sm" onClick={() => setRange("30d")}>30D</Button>
          <Button variant={range === "90d" ? "default" : "outline"} size="sm" onClick={() => setRange("90d")}>90D</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: "12,450", change: 5.2, icon: Users, color: "bg-emerald-500" },
          { label: "Avg Attendance", value: "87.3%", change: -1.3, icon: TrendingUp, color: "bg-blue-500" },
          { label: "Housing Occupancy", value: "78.5%", change: 3.7, icon: Hotel, color: "bg-amber-500" },
          { label: "NADA Engagement", value: "8.9K", change: 12.4, icon: MessageCircle, color: "bg-violet-500" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <div className="flex items-center gap-1">
                      {stat.change >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                      <span className={cn("text-sm font-medium", stat.change >= 0 ? "text-emerald-600" : "text-red-600")}>
                        {Math.abs(stat.change)}%
                      </span>
                    </div>
                  </div>
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", stat.color)}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>Students, attendance, and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D7377" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0D7377" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="students" stroke="#0D7377" fill="url(#colorStudents)" strokeWidth={2} />
                  <Line type="monotone" dataKey="attendance" stroke="#14A085" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Module Growth</CardTitle>
            <CardDescription>User growth by module</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="users" fill="#0D7377" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="growth" fill="#14A085" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module Usage Breakdown</CardTitle>
          <CardDescription>Detailed metrics by module</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {moduleBreakdown.map((module) => (
              <div key={module.name} className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{module.name}</span>
                  <Badge variant={module.growth >= 0 ? "success" : "destructive"}>
                    {module.growth >= 0 ? "+" : ""}{module.growth}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold">{module.users.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Active users</p>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(module.users / 12000) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
