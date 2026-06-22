"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Scan, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function ScanMarkPage() {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ScanMark</h1>
        <p className="text-muted-foreground mt-1">Attendance & Presence Verification</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col items-center justify-center p-12 min-h-[400px]">
          <div className={cn(
            "h-40 w-40 rounded-3xl flex items-center justify-center transition-all",
            scanning ? "bg-emerald-500/20 animate-pulse" : scanned ? "bg-emerald-500/10" : "bg-muted"
          )}>
            {scanned ? (
              <CheckCircle className="h-20 w-20 text-emerald-600" />
            ) : (
              <QrCode className={cn("h-20 w-20 transition-all", scanning ? "text-emerald-600" : "text-muted-foreground")} />
            )}
          </div>
          <h2 className="text-xl font-semibold mt-6">
            {scanned ? "Attendance Recorded!" : scanning ? "Scanning..." : "Scan QR Code"}
          </h2>
          <p className="text-muted-foreground text-center mt-2 max-w-sm">
            {scanned
              ? "Your attendance for CSC 301 has been successfully recorded."
              : "Point your camera at the lecturer's QR code to mark your attendance."}
          </p>
          {!scanned && (
            <Button variant="gradient" size="lg" className="mt-6 gap-2" onClick={handleScan} disabled={scanning}>
              <Scan className="h-5 w-5" />
              {scanning ? "Scanning..." : "Start Scan"}
            </Button>
          )}
          {scanned && (
            <Button variant="outline" className="mt-6" onClick={() => setScanned(false)}>
              Scan Another
            </Button>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Classes</CardTitle>
              <CardDescription>Your scheduled classes for today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { time: "08:00 AM", course: "CSC 301", venue: "LT 1", status: "attended" },
                { time: "10:00 AM", course: "MTH 301", venue: "LT 2", status: "upcoming" },
                { time: "02:00 PM", course: "CSC 303", venue: "Lab 3", status: "upcoming" },
              ].map((cls, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      cls.status === "attended" ? "bg-emerald-500" : "bg-amber-500"
                    )} />
                    <div>
                      <p className="text-sm font-medium">{cls.course}</p>
                      <p className="text-xs text-muted-foreground">{cls.venue}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{cls.time}</p>
                    <p className={cn(
                      "text-xs",
                      cls.status === "attended" ? "text-emerald-600" : "text-amber-600"
                    )}>
                      {cls.status === "attended" ? "Attended" : "Upcoming"}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>This semester</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { course: "CSC 301", attended: 18, total: 20, rate: 90 },
                { course: "MTH 301", attended: 16, total: 20, rate: 80 },
                { course: "CSC 303", attended: 19, total: 20, rate: 95 },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.course}</span>
                    <span className="text-sm text-muted-foreground">{item.attended}/{item.total}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        item.rate >= 90 ? "bg-emerald-500" : item.rate >= 75 ? "bg-amber-500" : "bg-red-500"
                      )}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
