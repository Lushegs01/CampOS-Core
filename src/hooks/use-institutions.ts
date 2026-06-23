import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface Institution {
  id: string;
  name: string;
  code: string;
  slug: string;
  country: string;
  city: string;
  students: number;
  faculties: number;
  isActive: boolean;
}

export function useInstitutions() {
  return useQuery({
    queryKey: ["institutions"],
    queryFn: async () => {
      const { data } = await api.get("/api/institution");
      return data.institutions as Institution[];
    },
  });
}
