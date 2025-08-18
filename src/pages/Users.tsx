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
import { mockUsers } from "@/contexts/AuthContext";

const defaultPermissions: Record<UserRole, UserPermissions> = {
  admin: {
    canCreateContracts: true,
    canEditContracts: true,
    canDeleteContracts: true,
    canManageUsers: true,
    canManageFolders: true,
    canAccessAnalytics: true,
    canExportData: true,
    canManageNotifications: true,
    canManageSystem: true,
  },
  manager: {
    canCreateContracts: true,
    canEditContracts: true,
    canDeleteContracts: false,
    canManageUsers: false,
    canManageFolders: true,
    canAccessAnalytics: true,
    canExportData: true,
    canManageNotifications: true,
    canManageSystem: false,
  },
  user: {
    canCreateContracts: false,
    canEditContracts: false,
    canDeleteContracts: false,
    canManageUsers: false,
    canManageFolders: false,
    canAccessAnalytics: false,
    canExportData: false,
    canManageNotifications: false,
    canManageSystem: false,
  },
};

export default function Users() {
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUserData, setEditUserData] = useState({
    name: "",
    email: "",
    department: "",
    phone: "",
    role: "user" as UserRole,
    isActive: true,
  });
  const [newInvite, setNewInvite] = useState({
    email: "",
    role: "user" as UserRole,
    department: "",
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filterByCreator, setFilterByCreator] = useState<string>("all");

  useEffect(() => {
    setUsers(mockUsers);

    setInviteCodes([
      {
        id: "1",
        code: "JURISYNC2024",
        role: "user",
        department: "Geral",
        createdBy: "admin-1",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        id: "2",
        code: "MANAGER2024",
        email: "novo.gerente@empresa.com",
        role: "manager",
        department: "Jurídico",
        createdBy: "admin-1",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ]);
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

  const handleCreateInvite = () => {
    if (!newInvite.email && !newInvite.role) {
      toast.error("Preencha pelo menos o e-mail ou selecione um cargo");
      return;
    }

    const code = generateInviteCode();
    const invite: InviteCode = {
      id: crypto.randomUUID(),
      code,
      email: newInvite.email || undefined,
      role: newInvite.role,
      department: newInvite.department || undefined,
      createdBy: user?.id || "",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    };

    setInviteCodes((prev) => [invite, ...prev]);
    setNewInvite({ email: "", role: "user", department: "" });
    setShowInviteDialog(false);
    toast.success("Código de convite criado com sucesso!");
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Código copiado para a área de transferência!");
    setTimeout(() => setCopiedCode(null), 2000);
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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

  const handleSaveUser = () => {
    if (!selectedUser) return;

    try {
      const updatedUsers = users.map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              ...editUserData,
              updatedAt: new Date(),
            }
          : u,
      );

      setUsers(updatedUsers);
      localStorage.setItem("jurisync_users", JSON.stringify(updatedUsers));

      // Reset form data
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
    } catch (error) {
      toast.error("Erro ao salvar usuário");
    }
  };

  const handleDeleteUser = (userId: string) => {
    const updatedUsers = users.filter((u) => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem("jurisync_users", JSON.stringify(updatedUsers));
    toast.success("Usuário removido com sucesso!");
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
                  <Label htmlFor="email">E-mail (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={newInvite.email}
                    onChange={(e) =>
                      setNewInvite((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>

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
                  <Label htmlFor="department">Departamento (opcional)</Label>
                  <Input
                    id="department"
                    placeholder="Ex: Jurídico, Financeiro"
                    value={newInvite.department}
                    onChange={(e) =>
                      setNewInvite((prev) => ({
                        ...prev,
                        department: e.target.value,
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
                          <Badge variant={u.isActive ? "default" : "secondary"}>
                            {u.isActive ? "Ativo" : "Inativo"}
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
                          {invite.createdAt.toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {invite.expiresAt.toLocaleDateString("pt-BR")}
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
                              onClick={() => {
                                const updatedCodes = inviteCodes.map((c) =>
                                  c.id === invite.id
                                    ? { ...c, isActive: false }
                                    : c,
                                );
                                setInviteCodes(updatedCodes);
                                toast.success("Convite desativado");
                              }}
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
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
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
          open={showPermissionsDialog}
          onOpenChange={setShowPermissionsDialog}
        >
          <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Permissões do Usuário</DialogTitle>
              <DialogDescription>
                Permissões baseadas no cargo:{" "}
                {selectedUser ? getRoleLabel(selectedUser.role) : ""}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 flex-1 overflow-hidden">
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
                  {Object.entries(getUserPermissions(selectedUser.role)).map(
                    ([permission, hasAccess]) => (
                      <div
                        key={permission}
                        className="flex items-center justify-between p-2 border rounded text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">
                            {permission
                              .replace("can", "")
                              .replace(/([A-Z])/g, " $1")
                              .trim()}
                          </p>
                        </div>
                        <Badge
                          variant={hasAccess ? "default" : "secondary"}
                          className="text-xs py-0 px-2 ml-2 flex-shrink-0"
                        >
                          {hasAccess ? "✓" : "✗"}
                        </Badge>
                      </div>
                    ),
                  )}
                </div>

                <Button
                  onClick={() => setShowPermissionsDialog(false)}
                  className="w-full flex-shrink-0"
                  size="sm"
                >
                  Fechar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
