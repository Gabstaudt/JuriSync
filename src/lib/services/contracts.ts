import { api } from "@/lib/api";
import { Contract, ContractComment, ContractHistoryEntry } from "@/types/contract";

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
      payload: { action: string; field?: string; oldValue?: string; newValue?: string; metadata?: Record<string, any> },
    ) => api.post<ContractHistoryEntry>(`/api/contracts/${id}/history`, payload),
  },
  notifications: {
    list: (id: string) => api.get<any[]>(`/api/contracts/${id}/notifications`),
    add: (
      id: string,
      payload: { type: string; message?: string; recipients: string[]; scheduledFor?: string | Date },
    ) => api.post<any>(`/api/contracts/${id}/notifications`, payload),
  },
};
