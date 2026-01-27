import { api } from "@/lib/api";

export type TemplateModel = {
  id: string;
  name: string;
  description?: string | null;
  filePath: string;
  fileName: string;
  fileType?: string | null;
  fileSize?: number | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  createdByName?: string | null;
};

export type TemplateHistory = {
  id: string;
  action: string;
  changedFields?: Record<string, any> | null;
  createdAt: string;
  createdBy?: string | null;
  createdByName?: string | null;
};

export type TemplateDetail = {
  template: TemplateModel;
  history: TemplateHistory[];
};

export const modelsService = {
  list: (q?: string) => api.get<TemplateModel[]>(`/api/templates${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  get: (id: string) => api.get<TemplateDetail>(`/api/templates/${id}`),
  create: (payload: Partial<TemplateModel>) => api.post<TemplateModel>("/api/templates", payload),
  update: (id: string, payload: Partial<TemplateModel>) => api.patch<TemplateModel>(`/api/templates/${id}`, payload),
  remove: (id: string) => api.delete(`/api/templates/${id}`),
};
