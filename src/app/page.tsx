import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  QrCode, BookOpen, Hotel, MessageCircle, Shield, Zap, Users, BarChart3,
  ArrowRight, CheckCircle, Globe, Lock, Activity
} from "lucide-react";

const features = [
  { icon: Shield, title: "Enterprise Security", description: "RBAC, JWT authentication, audit logs, and tenant isolation." },
  { icon: Zap, title: "Real-time", description: "Event-driven architecture with Redis for caching and sessions." },
  { icon: Users, title: "Multi-tenant", description: "Support thousands of institutions with complete data isolation." },
  { icon: BarChart3, title: "Analytics", description: "Built-in analytics engine with dashboards and reporting." },
  { icon: Lock, title: "Privacy First", description: "Anonymous profiles for NADA with zero identity exposure." },
  { icon: Globe, title: "Scalable", description: "Designed to serve millions of students across campuses." },
];

const modules = [
  { name: "ScanMark", description: "QR-based attendance verification", icon: QrCode, color: "from-emerald-500 to-teal-600" },
  { name: "UniReg", description: "Course registration & records", icon: BookOpen, color: "from-blue-500 to-indigo-600" },
  { name: "FunaaBnB", description: "Student housing management", icon: Hotel, color: "from-amber-500 to-orange-600" },
  { name: "NADA", description: "Anonymous social network", icon: MessageCircle, color: "from-violet-500 to-purple-600" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Zap className="h-4 w-4" />
            The University Operating System
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            One Platform for{" "}
            <span className="bg-gradient-to-r from-primary to-teal-500 bg-clip-text text-transparent">
              Every Campus
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            CampOS Core powers the complete university ecosystem. From attendance to housing,
            registration to social — everything connected, everything secure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" variant="gradient" className="gap-2 text-base px-8">
                Get Started <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Four Apps, One Platform</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every module is deeply integrated with the CampOS identity system and shares
              a unified data layer.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Card key={module.name} className="card-hover group">
                  <CardContent className="p-6">
                    <div className={cn("h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white mb-5", module.color)}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{module.name}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{module.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Built for Production</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Enterprise-grade architecture that scales from a single campus to a global network.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-start gap-4 p-5 rounded-xl border bg-card hover:shadow-md transition-all">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-0 bg-gradient-to-br from-primary/90 to-teal-700 text-white overflow-hidden">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4">Ready to transform your campus?</h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">
                Join institutions already using CampOS to power their digital infrastructure.
              </p>
              <Link href="/register">
                <Button size="lg" variant="secondary" className="gap-2">
                  Start Free <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg campos-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold">CampOS</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 CampOS Core. The University Operating System.
          </p>
        </div>
      </footer>
    </div>
  );
}
