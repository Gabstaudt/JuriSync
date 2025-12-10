export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  department?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  inviteCode?: string;
  invitedBy?: string;
}

// Representação recebida da API (datas podem vir como string)
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string | null;
  phone?: string | null;
  inviteCode?: string | null;
  isActive: boolean;
  lastLoginAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type UserRole = "admin" | "manager" | "user";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  inviteCode: string;
  department?: string;
  phone?: string;
}

export interface InviteCode {
  id: string;
  code: string;
  email?: string;
  role: UserRole;
  department?: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  usedBy?: string;
  isActive: boolean;
}

export interface UserPermissions {
  canViewContracts: boolean;
  canCreateContracts: boolean;
  canEditContracts: boolean;
  canDeleteContracts: boolean;
  canManageUsers: boolean;
  canCreateFolders: boolean;
  canManageFolders: boolean;
  canExportData: boolean;
  canManageNotifications: boolean;
  canAccessAnalytics: boolean;
}

export const defaultPermissions: Record<UserRole, UserPermissions> = {
  admin: {
    canViewContracts: true,
    canCreateContracts: true,
    canEditContracts: true,
    canDeleteContracts: true,
    canManageUsers: true,
    canCreateFolders: true,
    canManageFolders: true,
    canExportData: true,
    canManageNotifications: true,
    canAccessAnalytics: true,
  },
  manager: {
    canViewContracts: true,
    canCreateContracts: true,
    canEditContracts: true,
    canDeleteContracts: false,
    canManageUsers: false,
    canCreateFolders: true,
    canManageFolders: true,
    canExportData: true,
    canManageNotifications: true,
    canAccessAnalytics: true,
  },
  user: {
    canViewContracts: true,
    canCreateContracts: true,
    canEditContracts: false,
    canDeleteContracts: false,
    canManageUsers: false,
    canCreateFolders: false,
    canManageFolders: false,
    canExportData: false,
    canManageNotifications: false,
    canAccessAnalytics: false,
  },
};
