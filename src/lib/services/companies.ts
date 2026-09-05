import { api } from "@/lib/api";
import { Company, Party } from "@/types/company";

export const companiesService = {
  list: () => api.get<Company[]>("/api/companies"),
  create: (payload: { name: string; cnpj?: string; email?: string; phone?: string }) =>
    api.post<Company>("/api/companies", payload),
  update: (id: string, payload: Partial<Company>) =>
    api.patch<Company>(`/api/companies/${id}`, payload),
  remove: (id: string) => api.delete<{ ok: boolean }>(`/api/companies/${id}`),
  lookupCnpj: (cnpj: string) =>
    api.get<{
      valid: boolean;
      cnpj: string;
      corporateName?: string | null;
      tradeName?: string | null;
      status?: string | null;
      error?: string;
    }>(`/api/opencnpj?cnpj=${encodeURIComponent(cnpj)}`),
};

export const partiesService = {
  list: () => api.get<Party[]>("/api/parties"),
  create: (payload: { name: string; role: string; email?: string; phone?: string; companyId?: string | null }) =>
    api.post<Party>("/api/parties", payload),
  update: (id: string, payload: Partial<Party>) =>
    api.patch<Party>(`/api/parties/${id}`, payload),
  remove: (id: string) => api.delete<{ ok: boolean }>(`/api/parties/${id}`),
};
