"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hotel, MapPin, CheckCircle, Home, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function FunaaBnBPage() {
  const [selectedHostel, setSelectedHostel] = useState<string | null>(null);

  const hostels = [
    { id: "A", name: "Hostel A", type: "Male", capacity: 500, occupied: 420, price: 45000, rating: 4.2, amenities: ["WiFi", "Gym", "Laundry"] },
    { id: "B", name: "Hostel B", type: "Female", capacity: 400, occupied: 380, price: 48000, rating: 4.5, amenities: ["WiFi", "Kitchen", "Study Room"] },
    { id: "C", name: "Hostel C", type: "Mixed", capacity: 600, occupied: 450, price: 42000, rating: 3.8, amenities: ["WiFi", "Parking"] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FunaaBnB</h1>
          <p className="text-muted-foreground mt-1">Student Accommodation & Housing Management</p>
        </div>
        <Button variant="gradient">Apply for Housing</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Room</p>
                <p className="text-2xl font-bold">Hostel B</p>
                <p className="text-sm text-muted-foreground">Room 204</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Home className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <p className="text-2xl font-bold">Paid</p>
                <p className="text-sm text-muted-foreground">Session 2024/25</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="text-2xl font-bold">Oct 15</p>
                <p className="text-sm text-muted-foreground">Next session</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {hostels.map((hostel) => (
          <Card key={hostel.id} className={cn("card-hover cursor-pointer", selectedHostel === hostel.id && "ring-2 ring-primary")} onClick={() => setSelectedHostel(hostel.id)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{hostel.name}</CardTitle>
                <Badge variant={hostel.type === "Male" ? "default" : hostel.type === "Female" ? "secondary" : "outline"}>{hostel.type}</Badge>
              </div>
              <CardDescription>Student accommodation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-medium">{hostel.rating}</span>
                <span className="text-sm text-muted-foreground">({hostel.capacity} beds)</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Occupancy</span>
                  <span>{Math.round((hostel.occupied / hostel.capacity) * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      (hostel.occupied / hostel.capacity) > 0.9 ? "bg-red-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${(hostel.occupied / hostel.capacity) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {hostel.amenities.map((amenity) => (
                  <Badge key={amenity} variant="outline" className="text-xs">{amenity}</Badge>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-lg font-semibold">₦{hostel.price.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">/ session</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
