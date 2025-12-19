import { api } from "@/lib/api";
import { Folder } from "@/types/folder";
import { Contract } from "@/types/contract";

export const foldersService = {
  list: () => api.get<Folder[]>("/api/folders"),
  get: (id: string) => api.get<Folder>(`/api/folders/${id}`),
  create: (payload: Partial<Folder>) => api.post<Folder>("/api/folders", payload),
  update: (id: string, payload: Partial<Folder>) =>
    api.patch<Folder>(`/api/folders/${id}`, payload),
  delete: (id: string) => api.delete<{ ok: boolean }>(`/api/folders/${id}`),
  contracts: (id: string) => api.get<Contract[]>(`/api/folders/${id}/contracts`),
};
