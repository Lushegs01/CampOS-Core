import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  matricNumber: string | null;
  faculty: string | null;
  department: string | null;
  level: string | null;
  status: string;
  avatarUrl: string | null;
}

export function useStudents(search?: string, status?: string) {
  return useQuery({
    queryKey: ["students", search, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const { data } = await api.get(`/api/identity?${params.toString()}`);
      return data.users as Student[];
    },
  });
}
