import { api, API_URL } from "@/lib/api";
import { Contract, ContractComment, ContractHistoryEntry } from "@/types/contract";
import { Process } from "@/types/process";

export interface ContractFiltersApi {
  status?: string;
  q?: string;
  folderId?: string;
  page?: number;
  limit?: number;
}

export const contractsService = {
  list: (params: ContractFiltersApi = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.q) qs.set("q", params.q);
    if (params.folderId) qs.set("folderId", params.folderId);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const search = qs.toString() ? `?${qs.toString()}` : "";
    return api.get<Contract[]>(`/api/contracts${search}`);
  },
  get: (id: string) => api.get<Contract>(`/api/contracts/${id}`),
  create: (payload: Partial<Contract>) => api.post<Contract>("/api/contracts", payload),
  update: (id: string, payload: Partial<Contract>) =>
    api.patch<Contract>(`/api/contracts/${id}`, payload),
  comments: {
    list: (id: string) => api.get<ContractComment[]>(`/api/contracts/${id}/comments`),
    add: (id: string, payload: { content: string; isPrivate?: boolean; mentions?: string[] }) =>
      api.post<ContractComment>(`/api/contracts/${id}/comments`, payload),
  },
  history: {
    list: (id: string) => api.get<ContractHistoryEntry[]>(`/api/contracts/${id}/history`),
    add: (
      id: string,
      payload: {
        action: string;
        field?: string;
        oldValue?: string;
        newValue?: string;
        metadata?: Record<string, any>;
        author?: string;
        authorId?: string;
      },
    ) => api.post<ContractHistoryEntry>(`/api/contracts/${id}/history`, payload),
  },
  notifications: {
    list: (id: string) => api.get<any[]>(`/api/contracts/${id}/notifications`),
    add: (
      id: string,
      payload: { type: string; message?: string; recipients: string[]; scheduledFor?: string | Date },
    ) => api.post<any>(`/api/contracts/${id}/notifications`, payload),
  },
  processes: {
    list: (id: string) => api.get<Process[]>(`/api/contracts/${id}/processes`),
    add: (id: string, processId: string) =>
      api.post<{ ok: boolean }>(`/api/contracts/${id}/processes`, { processId }),
    remove: (id: string, processId: string) =>
      api.delete<{ ok: boolean }>(`/api/contracts/${id}/processes`, { processId }),
  },
  upload: async (file: File) => {
    const token = localStorage.getItem("jurisync_token");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/api/contracts/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Erro ao enviar arquivo");
    }
    return res.json() as Promise<{
      fileName: string;
      fileType: string;
      fileSize: number;
      filePath: string;
    }>;
  },
};
