import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  category: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export function useFiles() {
  return useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      const { data } = await api.get("/api/files");
      return data.files as FileUpload[];
    },
  });
}
