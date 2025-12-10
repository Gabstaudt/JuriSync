import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AuthState,
  LoginCredentials,
  PublicUser,
  RegisterData,
  User,
  UserPermissions,
  defaultPermissions,
} from "@/types/auth";
import { toast } from "sonner";
import { authService } from "@/lib/services/auth";
import { usersService } from "@/lib/services/users";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseUser = (u: PublicUser): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  department: u.department || undefined,
  phone: u.phone || undefined,
  inviteCode: u.inviteCode || undefined,
  isActive: u.isActive,
  createdAt: new Date(u.createdAt),
  updatedAt: new Date(u.updatedAt),
  lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = localStorage.getItem("jurisync_token");
      if (!storedToken) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return;
      }
      try {
        const { user } = await authService.me(storedToken);
        const parsed = parseUser(user);
        localStorage.setItem("jurisync_user", JSON.stringify(parsed));
        setAuthState({ user: parsed, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.removeItem("jurisync_user");
        localStorage.removeItem("jurisync_token");
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };
    bootstrap();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      const res = await authService.login(credentials.email, credentials.password);
      const parsedUser = parseUser(res.user);
      localStorage.setItem("jurisync_user", JSON.stringify(parsedUser));
      localStorage.setItem("jurisync_token", res.token);
      setAuthState({ user: parsedUser, isAuthenticated: true, isLoading: false });
      toast.success(`Bem-vindo(a), ${parsedUser.name}!`);
      return true;
    } catch (error: any) {
      toast.error(error?.message || "Erro ao autenticar");
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      const res = await authService.register(data);
      const parsedUser = parseUser(res.user);
      localStorage.setItem("jurisync_user", JSON.stringify(parsedUser));
      localStorage.setItem("jurisync_token", res.token);
      setAuthState({ user: parsedUser, isAuthenticated: true, isLoading: false });
      toast.success("Conta criada com sucesso!");
      return true;
    } catch (error: any) {
      toast.error(error?.message || "Erro ao registrar");
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("jurisync_token");
      if (token) await authService.logout(token);
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("jurisync_user");
      localStorage.removeItem("jurisync_token");
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      toast.success("Logout realizado com sucesso");
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      if (!authState.user) return false;
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      const updated = await usersService.update(authState.user.id, data);
      const parsed = parseUser(updated as unknown as PublicUser);
      localStorage.setItem("jurisync_user", JSON.stringify(parsed));
      setAuthState({ user: parsed, isAuthenticated: true, isLoading: false });
      toast.success("Perfil atualizado com sucesso!");
      return true;
    } catch (error: any) {
      toast.error(error?.message || "Erro ao atualizar perfil");
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!authState.user) return false;
    return defaultPermissions[authState.user.role][permission];
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const token = localStorage.getItem("jurisync_token");
      if (!token) return;
      const { user } = await authService.me(token);
      const parsed = parseUser(user);
      localStorage.setItem("jurisync_user", JSON.stringify(parsed));
      setAuthState((prev) => ({ ...prev, user: parsed, isAuthenticated: true }));
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    hasPermission,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
