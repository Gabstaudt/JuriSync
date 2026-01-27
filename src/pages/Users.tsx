import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, InviteCode, UserRole, UserPermissions } from "@/types/auth";
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
} from "lucide-react";
import { toast } from "sonner";
import { usersService, accessCodeService } from "@/lib/services/users";

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

const getRoleLabel = (role: UserRole) => {
  const labels = {
    admin: "Administrador",
    manager: "Gerente",
    user: "Usuário",
  };
  return labels[role];
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
    const fetchData = async () => {
      try {
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
        toast.error(error?.message || "Erro ao carregar usu?rios");
      }
    };
    fetchData();
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
      toast.success("C?digo de acesso criado com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao criar c?digo");
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
      setNewUserData({ name: "", email: "", phone: "", role: "user" });
      setShowAddUserDialog(false);
      toast.success("Usuário criado com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao criar usuário");
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
      toast.success("Usu?rio atualizado com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar usu?rio");
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
      toast.success("Usu?rio inativado com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao inativar usu?rio");
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

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gerenciar Usuários
            </h1>
            <p className="text-gray-600 mt-1">
              Controle de acesso e permissões do sistema
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowAddUserDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar usuário
            </Button>
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Convidar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                <DialogTitle>Criar Convite</DialogTitle>
                <DialogDescription>
                  Gere um código de convite para novos usuários
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Cargo</Label>
                  <Select
                    value={newInvite.role}
                    onValueChange={(value) =>
                      setNewInvite((prev) => ({
                        ...prev,
                        role: value as UserRole,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expira em (opcional)</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={newInvite.expiresAt}
                    onChange={(e) =>
                      setNewInvite((prev) => ({
                        ...prev,
                        expiresAt: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUses">Qtd. de usos permitidos</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min={1}
                    value={newInvite.maxUses}
                    onChange={(e) =>
                      setNewInvite((prev) => ({
                        ...prev,
                        maxUses: e.target.value,
                      }))
                    }
                  />
                </div>

                <Button onClick={handleCreateInvite} className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Gerar Código
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Novo usuário modal */}
        <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar usuário</DialogTitle>
              <DialogDescription>
                Crie um usuário diretamente informando os dados abaixo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newUserName">Nome</Label>
                <Input
                  id="newUserName"
                  value={newUserData.name}
                  onChange={(e) =>
                    setNewUserData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newUserEmail">E-mail</Label>
                <Input
                  id="newUserEmail"
                  type="email"
                  value={newUserData.email}
                  onChange={(e) =>
                    setNewUserData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newUserPhone">Telefone</Label>
                <Input
                  id="newUserPhone"
                  value={newUserData.phone}
                  onChange={(e) =>
                    setNewUserData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newUserRole">Tipo de usuário</Label>
                <Select
                  value={newUserData.role}
                  onValueChange={(value) =>
                    setNewUserData((prev) => ({ ...prev, role: value as UserRole }))
                  }
                >
                  <SelectTrigger id="newUserRole">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddUserDialog(false)}
                >
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleCreateUser}>
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Usuários
              </CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Administradores
              </CardTitle>
              <Shield className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {users.filter((u) => u.role === "admin").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Convites Ativos
              </CardTitle>
              <Key className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {inviteCodes.filter((c) => c.isActive).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuários Ativos
              </CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.isActive).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="invites">Convites</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Usuários</CardTitle>
                <CardDescription>
                  Gerencie usuários e suas permissões
                </CardDescription>
                <div className="flex items-center gap-4 mt-4">
                  <Label htmlFor="filterCreator" className="text-sm">
                    Filtrar por criador:
                  </Label>
                  <Select
                    value={filterByCreator}
                    onValueChange={setFilterByCreator}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os usuários</SelectItem>
                      {users
                        .filter((u) => u.role === "admin")
                        .map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            Criados por {admin.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último Acesso</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredUsers().map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-sm">
                                {getInitials(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{u.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(u.role)}>
                            {getRoleLabel(u.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>{u.department || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              u.isPending ? "outline" : u.isActive ? "default" : "secondary"
                            }
                          >
                            {u.isPending ? "Pendente" : u.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.lastLoginAt
                            ? new Date(u.lastLoginAt).toLocaleDateString(
                                "pt-BR",
                              )
                            : "Nunca"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleEditUser(u)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(u);
                                  setPermissionsDraft(
                                    (u.permissions as any) ||
                                      defaultPermissions[u.role],
                                  );
                                  setShowPermissionsDialog(true);
                                }}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Ver Permissões
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {u.id !== user?.id && (
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteUser(u.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remover
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Códigos de Convite Ativos</CardTitle>
                <CardDescription>
                  Gerencie códigos de convite para novos usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Usos</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inviteCodes.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                              {invite.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(invite.code)}
                            >
                              {copiedCode === invite.code ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {invite.email || (
                            <span className="text-gray-400">Qualquer</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(invite.role)}>
                            {getRoleLabel(invite.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {(invite.usedCount ?? 0)}/{invite.maxUses ?? 1}
                          </span>
                        </TableCell>
                        <TableCell>
                          {invite.createdAt
                            ? new Date(invite.createdAt).toLocaleDateString("pt-BR")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {invite.expiresAt
                            ? new Date(invite.expiresAt).toLocaleDateString("pt-BR")
                            : "Sem expiração"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={invite.isActive ? "default" : "secondary"}
                          >
                            {invite.isActive ? "Ativo" : "Expirado"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invite.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setInviteToDelete(invite)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {inviteCodes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhum código de convite ativo</p>
                    <p className="text-sm">
                      Crie códigos de convite para adicionar novos usuários
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog
          key={`edit-${selectedUser?.id || "none"}`}
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) {
              setSelectedUser(null);
              setEditUserData({
                name: "",
                email: "",
                department: "",
                phone: "",
                role: "user",
                isActive: true,
              });
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize as informações do usuário
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Nome</Label>
                <Input
                  id="editName"
                  value={editUserData.name}
                  onChange={(e) =>
                    setEditUserData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEmail">E-mail</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editUserData.email}
                  onChange={(e) =>
                    setEditUserData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editDepartment">Departamento</Label>
                  <Input
                    id="editDepartment"
                    value={editUserData.department}
                    onChange={(e) =>
                      setEditUserData((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editPhone">Telefone</Label>
                  <Input
                    id="editPhone"
                    value={editUserData.phone}
                    onChange={(e) =>
                      setEditUserData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editRole">Cargo</Label>
                <Select
                  value={editUserData.role}
                  onValueChange={(value) =>
                    setEditUserData((prev) => ({
                      ...prev,
                      role: value as UserRole,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="editActive"
                  checked={editUserData.isActive}
                  onCheckedChange={(checked) =>
                    setEditUserData((prev) => ({
                      ...prev,
                      isActive: checked,
                    }))
                  }
                />
                <Label htmlFor="editActive">Usuário ativo</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveUser} className="flex-1">
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Permissions Dialog */}
        <Dialog
          key={`permissions-${selectedUser?.id || "none"}`}
          open={showPermissionsDialog}
          onOpenChange={(open) => {
            setShowPermissionsDialog(open);
            if (!open) {
              setSelectedUser(null);
              setPermissionsDraft(null);
            }
          }}
        >
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Permissões do Usuário</DialogTitle>
              <DialogDescription>
                Permissões baseadas no cargo:{" "}
                {selectedUser ? getRoleLabel(selectedUser.role) : ""}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 flex-1">
                <div className="p-3 bg-gray-50 rounded-lg flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(selectedUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {selectedUser.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                  {Object.entries(
                    permissionsDraft ||
                      getUserPermissions(selectedUser.role),
                  ).map(([permission, hasAccess]) => (
                    <div
                      key={permission}
                      className="flex items-center justify-between p-2 border rounded text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">
                          {getPermissionLabel(permission)}
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(hasAccess)}
                        onCheckedChange={(checked) =>
                          setPermissionsDraft((prev) => ({
                            ...(prev ||
                              getUserPermissions(selectedUser.role)),
                            [permission]: checked,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowPermissionsDialog(false);
                      setPermissionsDraft(null);
                      setSelectedUser(null);
                    }}
                    className="flex-1 flex-shrink-0"
                    size="sm"
                    variant="outline"
                  >
                    Fechar
                  </Button>
                  <Button
                    onClick={handleSavePermissions}
                    className="flex-1 flex-shrink-0"
                    size="sm"
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirmar remoção de convite */}
        <Dialog
          open={Boolean(inviteToDelete)}
          onOpenChange={(open) => {
            if (!open) setInviteToDelete(null);
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Remover convite?</DialogTitle>
              <DialogDescription>
                {inviteToDelete
                  ? `Deseja remover o código ${inviteToDelete.code}?`
                  : "Deseja remover este convite?"}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setInviteToDelete(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!inviteToDelete) return;
                  try {
                    await accessCodeService.delete(inviteToDelete.id);
                    setInviteCodes((prev) =>
                      prev.filter((c) => c.id !== inviteToDelete.id),
                    );
                    toast.success("Convite removido");
                  } catch (error: any) {
                    toast.error(error?.message || "Erro ao remover convite");
                  } finally {
                    setInviteToDelete(null);
                  }
                }}
              >
                Remover
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
