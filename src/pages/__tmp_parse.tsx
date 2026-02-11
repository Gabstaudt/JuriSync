import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Contract, ContractFilters } from "@/types/contract";
import { Process } from "@/types/process";
import { Folder } from "@/types/folder";
import { Folder, FolderPermissions, folderColors, folderIcons } from "@/types/folder";
import { filterContracts, formatCurrency } from "@/lib/contracts";
import { ContractTable } from "@/components/contracts/ContractTable";
import { ContractCard } from "@/components/contracts/ContractCard";
import { ContractFilters as FiltersComponent } from "@/components/contracts/ContractFilters";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FolderOpen,
  Plus,
  Grid3X3,
  TableIcon,
  FileText,
  Building,
  Users,
  Settings,
  Star,
  Archive,
  Briefcase,
  Shield,
  Scale,
  Heart,
  Lock,
  Globe,
  Zap,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { foldersService } from "@/lib/services/folders";

export default function FolderContracts() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [filters, setFilters] = useState<ContractFilters>({});
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [contentMode, setContentMode] = useState<"contracts" | "processes">("contracts");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    color: string;
    icon: string;
    permissions: FolderPermissions;
  }>({
    name: "",
    description: "",
    color: folderColors[0],
    icon: folderIcons[0],
    permissions: {
      isPublic: true,
      canView: [],
      canEdit: [],
      canManage: [],
      viewRoles: ["admin", "manager", "user"],
      editRoles: ["admin", "manager"],
      manageRoles: ["admin"],
    },
  });
  const [permissionMode, setPermissionMode] = useState<"all" | "roles" | "custom">("all");

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      if (!folderId) return;
      try {
        setIsLoading(true);
        setLoadError(null);
        const [folderData, contractsData, processesData] = await Promise.all([
          foldersService.get(folderId),
          foldersService.contracts(folderId),
          foldersService.processes(folderId),
        ]);

        if (mounted && folderData) {
          setFolder({
            ...folderData,
            createdAt: new Date(folderData.createdAt),
            updatedAt: new Date(folderData.updatedAt),
          } as Folder);
        }

        const parsedContracts = Array.isArray(contractsData)
          ? contractsData.map((c) => ({
              ...c,
              startDate: new Date(c.startDate),
              endDate: new Date(c.endDate),
              createdAt: new Date(c.createdAt),
              updatedAt: new Date(c.updatedAt),
            }))
          : [];

        if (mounted) {
          setContracts(parsedContracts);
          setFilteredContracts(parsedContracts);
          setProcesses(Array.isArray(processesData) ? processesData : []);
        }
      } catch (error: any) {
        if (mounted) toast.error(error?.message || "Erro ao carregar dados da pasta");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [folderId]);

  useEffect(() => {
    const filtered = filterContracts(contracts, filters);
    setFilteredContracts(filtered);
  }, [contracts, filters]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await usersService.list();
        setUsers(data);
      } catch (error: any) {
        console.error("Erro ao carregar usuarios", error?.message);
      }
    };
    fetchUsers();
  }, []);

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      FolderOpen,
      Archive,
      Building,
      Briefcase,
      Shield,
      Scale,
      FileText,
      Users,
      Settings,
      Star,
      Heart,
      Lock,
      Globe,
      Zap,
    };
    return icons[iconName] || FolderOpen;
  };

  const getTotalValue = () => {
    return filteredContracts.reduce((sum, contract) => sum + contract.value, 0);
  };

  const getStatusCounts = () => {
    return {
      active: filteredContracts.filter((c) => c.status === "active").length,
      expiring: filteredContracts.filter((c) => c.status === "expiring_soon")
        .length,
      expired: filteredContracts.filter((c) => c.status === "expired").length,
    };
  };

  const normalizePermissions = (p?: Partial<FolderPermissions>): FolderPermissions => ({
    isPublic: Boolean(p?.isPublic ?? true),
    canView: Array.isArray(p?.canView) ? p!.canView : [],
    canEdit: Array.isArray(p?.canEdit) ? p!.canEdit : [],
    canManage: Array.isArray(p?.canManage) ? p!.canManage : [],
    viewRoles: Array.isArray((p as any)?.viewRoles) ? (p as any).viewRoles : [],
    editRoles: Array.isArray((p as any)?.editRoles) ? (p as any).editRoles : [],
    manageRoles: Array.isArray((p as any)?.manageRoles) ? (p as any).manageRoles : [],
  });

  const derivePermissionMode = (perms: FolderPermissions): "all" | "roles" | "custom" => {
    if (perms.isPublic) return "all";
    const hasCustomIds =
      perms.canView.length || perms.canEdit.length || perms.canManage.length;
    return hasCustomIds ? "custom" : "roles";
  };

  // Get unique values for filters
  const companies = [...new Set(contracts.map((c) => c.contractingCompany))];
  const responsibles = [
    ...new Set(contracts.map((c) => c.internalResponsible)),
  ];

  if (isLoading) {
    return (
      <Layout>
  );
}