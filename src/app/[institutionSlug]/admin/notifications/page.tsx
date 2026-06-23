"use client";

import { useNotifications } from "@/hooks/use-notifications";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Trash2, Loader2 } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useState } from "react";

const initialNotifications = [
  { id: "1", title: "Welcome to CampOS", message: "Your account has been verified successfully.", type: "success" as const, source: "core", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: "2", title: "Course Registration Open", message: "Registration for 2024/2025 session is now open.", type: "info" as const, source: "unireg", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: "3", title: "Housing Payment Due", message: "Your hostel fee payment is due in 3 days.", type: "warning" as const, source: "funaabnb", isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
  { id: "4", title: "Attendance Recorded", message: "Your attendance for CSC 301 was recorded.", type: "success" as const, source: "scanmark", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
];

export default function NotificationsPage() {
  const { data: notificationsData, isLoading } = useNotifications();
  const [notifications, setNotifications] = useState(notificationsData || initialNotifications);

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const displayNotifications = notificationsData || notifications;
  const unreadCount = displayNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">{unreadCount} unread notifications</p>
        </div>
        <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
          <Check className="h-4 w-4 mr-2" /> Mark all as read
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {displayNotifications.map((notification) => (
            <Card key={notification.id} className={cn("transition-all", !notification.isRead && "border-primary/30 bg-primary/5")}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                  notification.type === "success" && "bg-emerald-500/10",
                  notification.type === "info" && "bg-blue-500/10",
                  notification.type === "warning" && "bg-amber-500/10"
                )}>
                  <Bell className={cn(
                    "h-5 w-5",
                    notification.type === "success" && "text-emerald-600",
                    notification.type === "info" && "text-blue-600",
                    notification.type === "warning" && "text-amber-600"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{notification.title}</h3>
                    {!notification.isRead && <Badge variant="default" className="h-5 text-xs">New</Badge>}
                    <Badge variant="outline" className="text-xs">{notification.source}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatRelativeTime(new Date(notification.createdAt))}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!notification.isRead && (
                    <Button variant="ghost" size="icon" onClick={() => markAsRead(notification.id)} title="Mark as read">
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => deleteNotification(notification.id)} title="Delete">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
