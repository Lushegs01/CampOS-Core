import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
  source: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/api/notifications");
      return data.notifications as Notification[];
    },
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const { data } = await api.get("/api/notifications?unread=true");
      return (data.notifications as Notification[]).length;
    },
  });
}
