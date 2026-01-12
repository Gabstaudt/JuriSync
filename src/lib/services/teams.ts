import { api } from "@/lib/api";
import { Team } from "@/types/team";

export const teamsService = {
  list: () => api.get<Team[]>("/api/teams"),
  get: (id: string) => api.get<Team>(`/api/teams/${id}`),
  create: (payload: Partial<Team> & { members?: string[] }) => api.post<Team>("/api/teams", payload),
  update: (id: string, payload: Partial<Team> & { members?: string[] }) =>
    api.patch<Team>(`/api/teams/${id}`, payload),
  delete: (id: string) => api.delete<{ ok: boolean }>(`/api/teams/${id}`),
};
