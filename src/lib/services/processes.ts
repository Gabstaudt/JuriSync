import { api } from "@/lib/api";
import { Process } from "@/types/process";
import { Contract } from "@/types/contract";

export const processesService = {
  list: (params: { folderId?: string } = {}) => {
    const qs = params.folderId ? `?folderId=${encodeURIComponent(params.folderId)}` : "";
    return api.get<Process[]>(`/api/processes${qs}`);
  },
  get: (id: string) => api.get<Process>(`/api/processes/${id}`),
  create: (payload: Partial<Process>) => api.post<Process>("/api/processes", payload),
  update: (id: string, payload: Partial<Process>) => api.patch<Process>(`/api/processes/${id}`, payload),
  delete: (id: string) => api.delete<{ ok: boolean }>(`/api/processes/${id}`),
  contracts: {
    list: (id: string) => api.get<Contract[]>(`/api/processes/${id}/contracts`),
    add: (id: string, contractId: string) =>
      api.post<{ ok: boolean }>(`/api/processes/${id}/contracts`, { contractId }),
    remove: (id: string, contractId: string) =>
      api.delete<{ ok: boolean }>(`/api/processes/${id}/contracts`, { contractId }),
  },
};
