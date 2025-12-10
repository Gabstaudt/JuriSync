import { api } from "@/lib/api";
import { PublicUser } from "@/types/auth";

interface LoginResponse {
  token: string;
  user: PublicUser;
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/api/auth/login", { email, password }),
  register: (payload: {
    name: string;
    email: string;
    password: string;
    inviteCode: string;
    department?: string;
    phone?: string;
  }) => api.post<LoginResponse>("/api/auth/register", payload),
  me: (token?: string | null) => api.get<{ user: PublicUser }>("/api/auth/me", token),
  logout: (token?: string | null) => api.post<{ ok: boolean }>("/api/auth/logout", {}, token),
};
