import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface AttendanceRecord {
  id: string;
  courseCode: string;
  courseTitle: string | null;
  sessionTitle: string | null;
  status: string;
  scannedAt: string;
}

export interface AttendanceCourse {
  courseCode: string;
  courseTitle: string | null;
  count: number;
  lastScannedAt: string;
}

export interface AttendanceData {
  records: AttendanceRecord[];
  summary: { total: number; courses: AttendanceCourse[] };
}

const EMPTY_ATTENDANCE: AttendanceData = {
  records: [],
  summary: { total: 0, courses: [] },
};

export function useAttendance() {
  return useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      const { data } = await api.get("/api/attendance");
      // Guard against unexpected shapes (e.g. an auth redirect returning HTML),
      // so the dashboard never crashes on a missing `summary`.
      if (!data || typeof data !== "object" || !data.summary) {
        return EMPTY_ATTENDANCE;
      }
      return {
        records: Array.isArray(data.records) ? data.records : [],
        summary: {
          total: data.summary.total ?? 0,
          courses: Array.isArray(data.summary.courses) ? data.summary.courses : [],
        },
      } as AttendanceData;
    },
    // Refetch when the student switches back to CampOS after scanning in ScanMark.
    refetchOnWindowFocus: true,
  });
}
