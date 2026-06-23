import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface AnalyticsSummary {
  totalStudents: number;
  activeStudents: number;
  attendanceRate: number;
  housingOccupancy: number;
  nadaActiveUsers: number;
  newRegistrations: number;
  totalStudentsChange: number;
  attendanceRateChange: number;
  housingOccupancyChange: number;
  newRegistrationsChange: number;
}

export interface DailyData {
  date: string;
  students: number;
  attendance: number;
  housing: number;
  nada: number;
}

export interface ModuleBreakdown {
  name: string;
  users: number;
  growth: number;
}

export function useAnalytics(range: string = "30d") {
  return useQuery({
    queryKey: ["analytics", range],
    queryFn: async () => {
      const { data } = await api.get(`/api/analytics?range=${range}`);
      return {
        summary: data.summary as AnalyticsSummary,
        daily: data.daily as DailyData[],
        modules: data.modules as ModuleBreakdown[],
      };
    },
  });
}
