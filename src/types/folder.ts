export interface Folder {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  parentId?: string;
  path: string[];
  type: FolderType;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  contractCount: number;
  isActive: boolean;
  permissions: FolderPermissions;
}

export type FolderType = "system" | "custom" | "category";

export interface FolderPermissions {
  canView: string[]; // user IDs
  canEdit: string[]; // user IDs
  canManage: string[]; // user IDs
  isPublic: boolean;
}

export interface FolderTree {
  folder: Folder;
  children: FolderTree[];
  contracts: string[]; // contract IDs
}

export interface CreateFolderData {
  name: string;
  description?: string;
  color: string;
  icon: string;
  parentId?: string;
  type: FolderType;
  permissions: FolderPermissions;
}

// Predefined folder colors
export const folderColors = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#6366F1", // Indigo
];

// Predefined folder icons
export const folderIcons = [
  "Folder",
  "FolderOpen",
  "Archive",
  "Building",
  "Briefcase",
  "Shield",
  "Scale",
  "FileText",
  "Users",
  "Settings",
  "Star",
  "Heart",
  "Lock",
  "Globe",
  "Zap",
];

// System default folders
export const systemFolders: Omit<
  Folder,
  "id" | "createdBy" | "createdAt" | "updatedAt" | "contractCount"
>[] = [
  {
    name: "Todos os Contratos",
    description: "Todos os contratos do sistema",
    color: "#3B82F6",
    icon: "Folder",
    path: [],
    type: "system",
    isActive: true,
    permissions: {
      canView: [],
      canEdit: [],
      canManage: [],
      isPublic: true,
    },
  },
  {
    name: "Contratos Ativos",
    description: "Contratos com status ativo",
    color: "#10B981",
    icon: "Shield",
    path: [],
    type: "system",
    isActive: true,
    permissions: {
      canView: [],
      canEdit: [],
      canManage: [],
      isPublic: true,
    },
  },
  {
    name: "Vencendo em Breve",
    description: "Contratos que vencem nos próximos dias",
    color: "#F59E0B",
    icon: "AlertTriangle",
    path: [],
    type: "system",
    isActive: true,
    permissions: {
      canView: [],
      canEdit: [],
      canManage: [],
      isPublic: true,
    },
  },
  {
    name: "Contratos Vencidos",
    description: "Contratos que já venceram",
    color: "#EF4444",
    icon: "AlertCircle",
    path: [],
    type: "system",
    isActive: true,
    permissions: {
      canView: [],
      canEdit: [],
      canManage: [],
      isPublic: true,
    },
  },
];
