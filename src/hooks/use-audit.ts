import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface AuditLog {
  id: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  status: string;
  timestamp: string;
  ipAddress: string;
}

export function useAuditLogs(search?: string, action?: string) {
  return useQuery({
    queryKey: ["audit", search, action],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (action) params.set("action", action);
      const { data } = await api.get(`/api/audit?${params.toString()}`);
      return data.logs as AuditLog[];
    },
  });
}
