import { useState, useEffect, useMemo, useCallback } from "react";

import { useAuth } from "@/contexts/AuthContext";

import { User, InviteCode, UserRole, UserPermissions, defaultPermissions } from "@/types/auth";

import { Layout } from "@/components/layout/Layout";

import {

  Card,

  CardContent,

  CardDescription,

  CardHeader,

  CardTitle,

} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Badge } from "@/components/ui/badge";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Switch } from "@/components/ui/switch";

import { Separator } from "@/components/ui/separator";

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from "@/components/ui/select";

import {

  Table,

  TableBody,

  TableCell,

  TableHead,

  TableHeader,

  TableRow,

} from "@/components/ui/table";

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogHeader,

  DialogTitle,

  DialogTrigger,

} from "@/components/ui/dialog";

import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuLabel,

  DropdownMenuSeparator,

  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";

import {

  Plus,

  Users as UsersIcon,

  Mail,

  Key,

  Shield,

  Clock,

  Copy,

  Check,

  MoreHorizontal,

  UserPlus,
  Settings,
  Edit,
  Trash2,
  UsersRound,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";

import { usersService, accessCodeService } from "@/lib/services/users";
import { teamsService } from "@/lib/services/teams";
import { Team } from "@/types/team";

const defaultPermissions: Record<UserRole, UserPermissions> = {
  admin: {
    canViewContracts: true,
    canCreateContracts: true,
    canEditContracts: true,
    canDeleteContracts: true,
    canManageUsers: true,
    canCreateFolders: true,
    canManageFolders: true,
    canAccessAnalytics: true,
    canExportData: true,
    canManageNotifications: true,
    canManageSystem: true,
  },
  manager: {
    canViewContracts: true,
    canCreateContracts: true,
    canEditContracts: true,
    canDeleteContracts: false,
    canManageUsers: false,
    canCreateFolders: true,
    canManageFolders: true,
    canAccessAnalytics: true,
    canExportData: true,
    canManageNotifications: true,
    canManageSystem: false,
  },
  user: {
    canViewContracts: true,
    canCreateContracts: false,
    canEditContracts: false,
    canDeleteContracts: false,
    canManageUsers: false,
    canCreateFolders: false,
    canManageFolders: false,
    canAccessAnalytics: false,
    canExportData: false,
    canManageNotifications: false,
    canManageSystem: false,
  },
};

const permissionLabels: Record<keyof UserPermissions, string> = {
  canCreateContracts: "Criar contratos",
  canEditContracts: "Editar contratos",
  canDeleteContracts: "Excluir contratos",
  canManageUsers: "Gerenciar usuários",
  canManageFolders: "Gerenciar pastas",
  canAccessAnalytics: "Acessar análises",
  canExportData: "Exportar dados",
  canManageNotifications: "Gerenciar notificações",
  canManageSystem: "Administrar sistema",
};



const getRoleColor = (role: UserRole) => {

  const colors = {

    admin: "bg-red-100 text-red-800",

    manager: "bg-blue-100 text-blue-800",

    user: "bg-green-100 text-green-800",

  };

  return colors[role];

};

const getPermissionLabel = (permission: string) => {
  const map: Record<string, string> = {
    canViewContracts: "Ver contratos",
    canCreateContracts: "Criar contratos",
    canEditContracts: "Editar contratos",
    canDeleteContracts: "Excluir contratos",
    canManageUsers: "Gerenciar usuários",
    canCreateFolders: "Criar pastas",
    canManageFolders: "Gerenciar pastas",
    canExportData: "Exportar dados",
    canManageNotifications: "Gerenciar notificações",
    canAccessAnalytics: "Acessar analytics",
    canManageSystem: "Administrar sistema",
  };
  return map[permission] || permission;
};

const getInitials = (name: string) =>

  name

    .split(" ")

    .map((n) => n[0])

    .join("")

    .toUpperCase()

    .slice(0, 2);



export default function Users() {

  const { user, hasPermission } = useAuth();

  const [users, setUsers] = useState<User[]>([]);

  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showAddUserDialog, setShowAddUserDialog] = useState(false);

  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const [showEditDialog, setShowEditDialog] = useState(false);

  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissionsDraft, setPermissionsDraft] = useState<UserPermissions | null>(null);
  const [editUserData, setEditUserData] = useState({

    name: "",

    email: "",

    department: "",

    phone: "",

    role: "user" as UserRole,

    isActive: true,

  });

  const newUserDefaults = { name: "", email: "", phone: "", role: "user" as UserRole };
  const newInviteDefaults = { role: "user" as UserRole, expiresAt: "" };

  const [newInvite, setNewInvite] = useState(newInviteDefaults);

  const [newUserData, setNewUserData] = useState(newUserDefaults);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filterByCreator, setFilterByCreator] = useState<string>("all");
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamForm, setTeamForm] = useState({ id: "", name: "", description: "", users: [] as string[] });
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [permissionForm, setPermissionForm] = useState<UserPermissions | null>(null);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const resetTeamForm = () => setTeamForm({ id: "", name: "", description: "", users: [] });
  const resetEditUserForm = () =>
    setEditUserData({
      name: "",
      email: "",
      department: "",
      phone: "",
      role: "user",
      isActive: true,
    });

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setSelectedUser(null);
    resetEditUserForm();
  };

  const handleClosePermissionsDialog = () => {
    setShowPermissionsDialog(false);
    setSelectedUser(null);
    setPermissionForm(null);
  };
  const [newInvite, setNewInvite] = useState({
    role: "user" as UserRole,
    expiresAt: "",
    maxUses: "1",
  });
  const [inviteToDelete, setInviteToDelete] = useState<InviteCode | null>(null);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user" as UserRole,
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filterByCreator, setFilterByCreator] = useState<string>("all");
  const anyDialogOpen =
    showAddUserDialog ||
    showInviteDialog ||
    showEditDialog ||
    showPermissionsDialog ||
    Boolean(inviteToDelete);

  useEffect(() => {
    if (!anyDialogOpen) {
      document.body.style.pointerEvents = "";
    }
  }, [anyDialogOpen]);

  const mapInvite = (i: any): InviteCode => ({
    ...i,
    createdAt: i.created_at ? new Date(i.created_at) : new Date(i.createdAt || new Date()),
    expiresAt: i.expires_at ? new Date(i.expires_at) : i.expiresAt ? new Date(i.expiresAt) : undefined,
    usedAt: i.used_at ? new Date(i.used_at) : i.usedAt ? new Date(i.usedAt) : undefined,
    role: i.role,
    code: i.code,
    isActive: i.is_active ?? i.isActive ?? true,
    maxUses: i.max_uses ?? i.maxUses ?? 1,
    usedCount: i.used_count ?? i.usedCount ?? 0,
  });

  const mapUser = (u: any): User => ({
    ...u,
    createdAt: new Date(u.createdAt ?? u.created_at ?? new Date()),
    updatedAt: new Date(u.updatedAt ?? u.updated_at ?? new Date()),
    lastLoginAt: u.lastLoginAt
      ? new Date(u.lastLoginAt)
      : u.last_login_at
        ? new Date(u.last_login_at)
        : undefined,
    isPending: Boolean(u.isPending ?? u.is_pending),
    isActive: Boolean(u.isActive ?? u.is_active),
    permissions:
      (u.permissions as any) ||
      (u.role ? defaultPermissions[u.role as UserRole] : defaultPermissions.user),
  });

  useEffect(() => {
    if (showPermissionsDialog && selectedUser) {
      setPermissionForm((selectedUser as any).permissions || defaultPermissions[selectedUser.role]);
    }
  }, [showPermissionsDialog, selectedUser]);

  // Memoized role labels and permission labels to reduce renders in large lists
  const roleLabelMap = useMemo(
    () => ({
      admin: "Administrador",
      manager: "Gerente",
      user: "Usuário",
    }),
    [],
  );

  const getRoleLabel = useCallback((role: UserRole) => roleLabelMap[role], [roleLabelMap]);

  useEffect(() => {

    const fetchData = async () => {
      try {
        setLoadingData(true);
        setErrorMessage(null);

        const [userData, invites] = await Promise.all([

          usersService.list(),

          accessCodeService.list(),

        ]);

        setUsers(
          userData.map((u) => mapUser(u)),
        );

        setInviteCodes(
          invites.map((i: any) => mapInvite(i)) as unknown as InviteCode[],
        );

      } catch (error: any) {

        const msg = error?.message || "Erro ao carregar usuários";
        setErrorMessage(msg);
        toast.error(msg);

      }
      setLoadingData(false);
    };

    fetchData();
    loadTeams();
  }, []);





  

const generateInviteCode = () => {

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let result = "";

    for (let i = 0; i < 12; i++) {

      result += characters.charAt(

        Math.floor(Math.random() * characters.length),

      );

    }

    return result;

  };



  const handleCreateInvite = async () => {

    const code = generateInviteCode();

    try {

      const created = await accessCodeService.create({

        code,

        role: newInvite.role,

        expiresAt: newInvite.expiresAt || undefined,
        maxUses: Number(newInvite.maxUses) > 0 ? Number(newInvite.maxUses) : 1,
      });
      setInviteCodes((prev) => [mapInvite(created), ...prev]);
      setNewInvite({ role: "user", expiresAt: "", maxUses: "1" } as any);
      setShowInviteDialog(false);

      toast.success("Código de acesso criado com sucesso!");

    } catch (error: any) {

      const msg = error?.message || "Erro ao criar código";
      setErrorMessage(msg);
      toast.error(msg);

    }

  };



  const handleCreateUser = async () => {

    try {

      const created = await usersService.create({

        ...newUserData,

      });

      setUsers((prev) => [
        mapUser(created),
        ...prev,

      ]);

      setNewUserData(newUserDefaults);

      setShowAddUserDialog(false);

      toast.success("Usuário criado com sucesso!");

    } catch (error: any) {

      const msg = error?.message || "Erro ao criar usuário";
      setErrorMessage(msg);
      toast.error(msg);

    }

  };



const handleEditUser = (userToEdit: User) => {

    setSelectedUser(userToEdit);

    setEditUserData({

      name: userToEdit.name,

      email: userToEdit.email,

      department: userToEdit.department || "",

      phone: userToEdit.phone || "",

      role: userToEdit.role,

      isActive: userToEdit.isActive,

    });

    setShowEditDialog(true);

  };



  const handleSaveUser = async () => {

    if (!selectedUser) return;



    try {

      const updated = await usersService.update(selectedUser.id, editUserData);

      setUsers((prev) =>

        prev.map((u) =>

          u.id === selectedUser.id

            ? {
                ...mapUser(updated),
              }

            : u,

        ),

      );



      setEditUserData({

        name: "",

        email: "",

        department: "",

        phone: "",

        role: "user",

        isActive: true,

      });



      setShowEditDialog(false);

      setSelectedUser(null);

      toast.success("Usuário atualizado com sucesso!");

    } catch (error: any) {

      const msg = error?.message || "Erro ao salvar usuário";
      setErrorMessage(msg);
      toast.error(msg);

    }

  };



const handleDeleteUser = async (userId: string) => {

    try {

      const updated = await usersService.update(userId, { isActive: false });

      setUsers((prev) =>

        prev.map((u) =>

          u.id === userId

            ? {
                ...mapUser(updated),
              }

            : u,

        ),

      );

      toast.success("Usuário inativado com sucesso!");

    } catch (error: any) {

      const msg = error?.message || "Erro ao inativar usuário";
      setErrorMessage(msg);
      toast.error(msg);

    }

  };

  const handleSavePermissions = async () => {
    if (!selectedUser || !permissionsDraft) return;
    try {
      const updated = await usersService.update(selectedUser.id, {
        permissions: permissionsDraft,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? mapUser(updated) : u)),
      );
      setShowPermissionsDialog(false);
      setSelectedUser(null);
      setPermissionsDraft(null);
      toast.success("Permissões atualizadas com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar permissões");
    }
  };

const getUserPermissions = (userRole: UserRole) => {
    return defaultPermissions[userRole];
  };



  const getFilteredUsers = () => {
    if (filterByCreator === "all") return users;
    return users.filter((u) => u.invitedBy === filterByCreator);
  };

  const loadTeams = async () => {
    setTeamsLoading(true);
    try {
      const data = await teamsService.list();
      setTeams(data || []);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao carregar equipes");
    } finally {
      setTeamsLoading(false);
    }
  };

  const handleSaveTeam = async () => {
    if (!teamForm.name.trim()) {
      toast.error("Informe o nome da equipe");
      return;
    }
    if (!teamForm.users.length) {
      toast.error("Selecione pelo menos um usuário");
      return;
    }

    try {
      if (teamForm.id) {
        const updated = await teamsService.update(teamForm.id, {
          name: teamForm.name,
          description: teamForm.description || undefined,
          members: teamForm.users,
        });
        setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        toast.success("Equipe atualizada");
      } else {
        const created = await teamsService.create({
          name: teamForm.name,
          description: teamForm.description || undefined,
          members: teamForm.users,
        });
        setTeams((prev) => [created, ...prev]);
        toast.success("Equipe criada");
      }
      resetTeamForm();
      setIsTeamDialogOpen(false);
    } catch (error) {
      toast.error(error?.message || "Erro ao salvar equipe");
    }
  };

const startEditTeam = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;
    setTeamForm({
      id: team.id,
      name: team.name,
      description: team.description || "",
      users: (team.members || []).map((m: any) => m.id) || (team as any).users || [],
    });
    setIsTeamDialogOpen(true);
  };

  const deleteTeam = async (teamId: string) => {
    try {
      await teamsService.delete(teamId);
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      toast.success("Equipe removida");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao remover equipe");
    }
  };


  if (!hasPermission("canManageUsers")) {

    return (

      <Layout>

        <div className="flex items-center justify-center min-h-[500px]">

          <div className="text-center">

            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />

            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>

            <p className="text-muted-foreground">
              Você não tem permissão para gerenciar usuários.
            </p>

          </div>

        </div>

      </Layout>

    );

  }
  return null;
}
