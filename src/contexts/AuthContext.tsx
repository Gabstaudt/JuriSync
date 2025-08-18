import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  AuthState,
  LoginCredentials,
  RegisterData,
  UserPermissions,
  defaultPermissions,
} from "@/types/auth";
import { toast } from "sonner";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for development
const mockUsers: User[] = [
  {
    id: "admin-1",
    name: "Admin Principal",
    email: "admin@jurisync.com",
    role: "admin",
    department: "TI",
    phone: "+55 11 99999-9999",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  },
  {
    id: "manager-1",
    name: "João Silva",
    email: "joao@jurisync.com",
    role: "manager",
    department: "Jurídico",
    phone: "+55 11 98888-8888",
    isActive: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  },
  {
    id: "user-1",
    name: "Maria Santos",
    email: "maria@jurisync.com",
    role: "user",
    department: "Financeiro",
    phone: "+55 11 97777-7777",
    isActive: true,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  },
];

// Mock credentials (in production, this would be handled by a backend)
const mockCredentials = {
  "admin@jurisync.com": "admin123",
  "joao@jurisync.com": "joao123",
  "maria@jurisync.com": "maria123",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem("jurisync_user");
        const storedToken = localStorage.getItem("jurisync_token");

        if (storedUser && storedToken) {
          const user = JSON.parse(storedUser);
          // Convert date strings back to Date objects
          user.createdAt = new Date(user.createdAt);
          user.updatedAt = new Date(user.updatedAt);
          if (user.lastLoginAt) user.lastLoginAt = new Date(user.lastLoginAt);

          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Error loading user from storage:", error);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check credentials
      const password =
        mockCredentials[credentials.email as keyof typeof mockCredentials];
      if (!password || password !== credentials.password) {
        toast.error("Credenciais inválidas");
        return false;
      }

      // Find user
      const user = mockUsers.find((u) => u.email === credentials.email);
      if (!user) {
        toast.error("Usuário não encontrado");
        return false;
      }

      if (!user.isActive) {
        toast.error("Usuário inativo. Entre em contato com o administrador.");
        return false;
      }

      // Update last login
      const updatedUser = {
        ...user,
        lastLoginAt: new Date(),
      };

      // Store in localStorage
      localStorage.setItem("jurisync_user", JSON.stringify(updatedUser));
      localStorage.setItem("jurisync_token", "mock-jwt-token");

      setAuthState({
        user: updatedUser,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success(`Bem-vindo(a), ${user.name}!`);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Erro interno. Tente novamente.");
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Check if email already exists
      if (mockUsers.find((u) => u.email === data.email)) {
        toast.error("Este e-mail já está cadastrado");
        return false;
      }

      // Validate invite code (simplified)
      if (data.inviteCode !== "JURISYNC2024") {
        toast.error("Código de convite inválido");
        return false;
      }

      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: data.name,
        email: data.email,
        role: "user", // Default role for new users
        department: data.department,
        phone: data.phone,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        inviteCode: data.inviteCode,
      };

      // Add to mock users (in production, this would be sent to backend)
      mockUsers.push(newUser);

      // Auto-login after registration
      localStorage.setItem("jurisync_user", JSON.stringify(newUser));
      localStorage.setItem("jurisync_token", "mock-jwt-token");

      setAuthState({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success("Conta criada com sucesso!");
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Erro interno. Tente novamente.");
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("jurisync_user");
    localStorage.removeItem("jurisync_token");
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    toast.success("Logout realizado com sucesso");
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      if (!authState.user) return false;

      setAuthState((prev) => ({ ...prev, isLoading: true }));

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedUser = {
        ...authState.user,
        ...data,
        updatedAt: new Date(),
      };

      localStorage.setItem("jurisync_user", JSON.stringify(updatedUser));

      setAuthState({
        user: updatedUser,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success("Perfil atualizado com sucesso!");
      return true;
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Erro ao atualizar perfil");
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
      // In production, this would fetch fresh user data from the backend
      const storedUser = localStorage.getItem("jurisync_user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.createdAt = new Date(user.createdAt);
        user.updatedAt = new Date(user.updatedAt);
        if (user.lastLoginAt) user.lastLoginAt = new Date(user.lastLoginAt);

        setAuthState((prev) => ({ ...prev, user }));
      }
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

// Export mock data for development
export { mockUsers, mockCredentials };
