import { api } from "@/lib/api";
import { User } from "@/types/auth";

export const usersService = {
  list: () => api.get<User[]>("/api/users"),
  get: (id: string) => api.get<User>(`/api/users/${id}`),
  create: (payload: Partial<User> & { password?: string }) =>
    api.post<User>("/api/users", payload),
  update: (id: string, payload: Partial<User>) =>
    api.patch<User>(`/api/users/${id}`, payload),
};

export interface InviteCode {
  id: string;
  code: string;
  email?: string;
  role: "admin" | "manager" | "user";
  department?: string;
  createdBy?: string;
  createdAt: string;
  expiresAt?: string;
  usedAt?: string;
  usedBy?: string;
  isActive: boolean;
}

export const inviteService = {
  list: (activeOnly = false) =>
    api.get<InviteCode[]>(`/api/invite-codes${activeOnly ? "?active=true" : ""}`),
  create: (payload: { role: InviteCode["role"]; email?: string; department?: string; expiresAt?: string; code?: string }) =>
    api.post<InviteCode>("/api/invite-codes", payload),
};
