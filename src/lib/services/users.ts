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

export const accessCodeService = {
  list: () => api.get<InviteCode[]>("/api/access-codes"),
  create: (payload: {
    role: InviteCode["role"];
    expiresAt?: string;
    code?: string;
  }) => api.post<InviteCode>("/api/access-codes", payload),
};
