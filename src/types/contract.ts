export interface Contract {
  id: string;
  name: string;
  description?: string;
  contractingCompany: string;
  contractedParty: string;
  startDate: Date;
  endDate: Date;
  value: number;
  internalResponsible: string;
  responsibleEmail: string;
  status: ContractStatus;
  filePath?: string;
  fileName?: string;
  fileType?: "pdf" | "docx";
  folderId?: string;
  folderPath?: string[];
  tags: string[];
  priority: ContractPriority;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  comments: ContractComment[];
  history: ContractHistoryEntry[];
  attachments: ContractAttachment[];
  notifications: ContractNotification[];
  isArchived: boolean;
  permissions: ContractPermissions;
}

export interface ContractAttachment {
  id: string;
  contractId: string;
  name: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  filePath: string;
}

export interface ContractNotification {
  id: string;
  contractId: string;
  type: NotificationType;
  message: string;
  recipients: string[];
  sentAt?: Date;
  scheduledFor: Date;
  isActive: boolean;
  createdBy: string;
}

export type NotificationType =
  | "expiry_reminder"
  | "renewal_reminder"
  | "custom";

export interface ContractPermissions {
  canView: string[]; // user IDs
  canEdit: string[]; // user IDs
  canComment: string[]; // user IDs
  isPublic: boolean;
}

export interface ContractComment {
  id: string;
  contractId: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: Date;
  editedAt?: Date;
  isPrivate: boolean;
  mentions: string[]; // user IDs
}

export interface ContractHistoryEntry {
  id: string;
  contractId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  author: string;
  authorId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type ContractStatus =
  | "active"
  | "expiring_soon"
  | "expired"
  | "draft"
  | "archived";

export type ContractPriority = "low" | "medium" | "high" | "critical";

export interface ContractFilters {
  status?: ContractStatus;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  responsible?: string;
  contractingCompany?: string;
  folderId?: string;
  tags?: string[];
  priority?: ContractPriority;
  createdBy?: string;
}

export interface NotificationSettings {
  daysBeforeExpiry: number;
  emailEnabled: boolean;
  reminderEnabled: boolean;
  recipients: string[];
}

export interface ExportOptions {
  format: "csv" | "pdf";
  includeExpired: boolean;
  includeActive: boolean;
  includeExpiringSoon: boolean;
  includeDraft: boolean;
  includeArchived: boolean;
  folderId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  expiringSoonContracts: number;
  expiredContracts: number;
  draftContracts: number;
  totalValue: number;
  monthlyValue: number;
  averageContractValue: number;
  contractsByFolder: Record<string, number>;
  contractsByResponsible: Record<string, number>;
}

export interface ChartData {
  contractsByStatus: {
    status: string;
    count: number;
    color: string;
  }[];
  monthlyEvolution: {
    month: string;
    contracts: number;
    value: number;
  }[];
  financialByMonth: {
    month: string;
    value: number;
  }[];
  contractsByFolder: {
    folder: string;
    count: number;
    color: string;
  }[];
  contractsByPriority: {
    priority: string;
    count: number;
    color: string;
  }[];
}

export interface CreateContractData {
  name: string;
  description?: string;
  contractingCompany: string;
  contractedParty: string;
  startDate: Date;
  endDate: Date;
  value: number;
  internalResponsible: string;
  responsibleEmail: string;
  folderId?: string;
  tags: string[];
  priority: ContractPriority;
  permissions: ContractPermissions;
}
