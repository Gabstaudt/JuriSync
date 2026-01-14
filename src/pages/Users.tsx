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

          userData.map((u) => ({

            ...u,

            createdAt: new Date(u.createdAt),

            updatedAt: new Date(u.updatedAt),

            lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : undefined,

            isPending: Boolean((u as any).isPending),
            permissions: (u as any).permissions,

          })),

        );

        setInviteCodes(

          invites.map((i: any) => ({

            ...i,

            createdAt: i.created_at ? new Date(i.created_at) : new Date(i.createdAt || new Date()),

            expiresAt: i.expires_at ? new Date(i.expires_at) : i.expiresAt ? new Date(i.expiresAt) : undefined,

            usedAt: i.used_at ? new Date(i.used_at) : i.usedAt ? new Date(i.usedAt) : undefined,

            role: i.role,

            code: i.code,

            isActive: i.is_active ?? i.isActive,

          })) as unknown as InviteCode[],

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

      });

      setInviteCodes((prev) => [created as unknown as InviteCode, ...prev]);

      setNewInvite(newInviteDefaults);

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

        {

          ...created,

          createdAt: new Date(created.createdAt),

          updatedAt: new Date(created.updatedAt),

          lastLoginAt: created.lastLoginAt ? new Date(created.lastLoginAt) : undefined,

          isPending: Boolean((created as any).isPending),

        },

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

                ...updated,

                createdAt: new Date(updated.createdAt),

                updatedAt: new Date(updated.updatedAt),

                lastLoginAt: updated.lastLoginAt ? new Date(updated.lastLoginAt) : undefined,

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

                ...updated,

                createdAt: new Date(updated.createdAt),

                updatedAt: new Date(updated.updatedAt),

                lastLoginAt: updated.lastLoginAt ? new Date(updated.lastLoginAt) : undefined,

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
    if (!selectedUser || !permissionForm) return;
    try {
      setSavingPermissions(true);
      await usersService.update(selectedUser.id, { permissions: permissionForm } as any);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, permissions: permissionForm } : u,
        ),
      );
      toast.success("Permissões atualizadas");
      handleClosePermissionsDialog();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar permissões");
    } finally {
      setSavingPermissions(false);
    }
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

            <Dialog
              modal={false}
              open={showInviteDialog}
              onOpenChange={(open) => {
                setShowInviteDialog(open);
                if (!open) setNewInvite(newInviteDefaults);
              }}
            >

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

        <Dialog
          modal={false}
          open={showAddUserDialog}
          onOpenChange={(open) => {
            setShowAddUserDialog(open);
            if (!open) setNewUserData(newUserDefaults);
          }}
        >

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
            <TabsTrigger value="teams">Equipes</TabsTrigger>
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

                      <TableHead>ltimo Acesso</TableHead>

                      <TableHead></TableHead>

                    </TableRow>

                  </TableHeader>

                  <TableBody>
                    {loadingData && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
                            <div className="h-4 bg-gray-100 rounded w-1/4 animate-pulse" />
                            <div className="h-4 bg-gray-100 rounded w-1/5 animate-pulse" />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {!loadingData &&
                    getFilteredUsers().map((u) => (

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

                          <DropdownMenu modal={false}>

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
                                  setPermissionForm(
                                    (u as any).permissions || defaultPermissions[u.role],
                                  );
                                  setShowPermissionsDialog(true);

                                }}

                              >

                                <Shield className="mr-2 h-4 w-4" />

                                Ver permissões

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

                <CardTitle>Cdigos de Convite Ativos</CardTitle>

                <CardDescription>

                  Gerencie códigos de convite para novos usuários

                </CardDescription>

              </CardHeader>

              <CardContent>

                <Table>

                  <TableHeader>

                    <TableRow>

                      <TableHead>Cdigo</TableHead>

                      <TableHead>E-mail</TableHead>

                      <TableHead>Cargo</TableHead>

                      <TableHead>Criado em</TableHead>

                      <TableHead>Expira em</TableHead>

                      <TableHead>Status</TableHead>

                      <TableHead></TableHead>

                    </TableRow>

                  </TableHeader>

                  <TableBody>
                    {loadingData && (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
                            <div className="h-4 bg-gray-100 rounded w-1/4 animate-pulse" />
                            <div className="h-4 bg-gray-100 rounded w-1/5 animate-pulse" />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {!loadingData &&
                    inviteCodes.map((invite) => (

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

                          {invite.createdAt

                            ? new Date(invite.createdAt).toLocaleDateString("pt-BR")

                            : "-"}

                        </TableCell>

                        <TableCell>

                          {invite.expiresAt

                            ? new Date(invite.expiresAt).toLocaleDateString("pt-BR")

                            : "Sem expirao"}

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

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Equipes</CardTitle>
                  <CardDescription>Monte equipes com usuários existentes.</CardDescription>
                </div>
                <Button onClick={() => setIsTeamDialogOpen(true)}>
                  <UsersRound className="h-4 w-4 mr-2" />
                  Nova equipe
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {teams.length ? (
                  teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{team.name}</p>
                        {team.description && (
                          <p className="text-xs text-muted-foreground">{team.description}</p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-2">
                          {(team.members || []).map((member) => (
                            <Badge key={member.id} variant="secondary">
                              {member.name || member.email || member.id}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEditTeam(team.id)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteTeam(team.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma equipe criada ainda.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>


        {/* Edit User Dialog */}
        <Dialog
          modal={false}
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) {
              handleCloseEditDialog();
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
                <Button
                  onClick={async () => {
                    await handleSaveUser();
                    setShowEditDialog(false);
                    resetEditUserForm();
                  }}
                  className="flex-1"
                >
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Team Dialog */}
        <Dialog
          modal={false}
          open={isTeamDialogOpen}
          onOpenChange={(open) => {
            setIsTeamDialogOpen(open);
            if (!open) resetTeamForm();
          }}
        >
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{teamForm.id ? "Editar equipe" : "Nova equipe"}</DialogTitle>
              <DialogDescription>Defina o nome, descrição e membros da equipe.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da equipe</Label>
                <Input
                  value={teamForm.name}
                  onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Jurídico Estratégico"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={teamForm.description}
                  onChange={(e) => setTeamForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Resumo da atuação da equipe"
                />
              </div>
              <div className="space-y-2">
                <Label>Membros</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span>
                        {teamForm.users.length
                          ? `${teamForm.users.length} selecionado(s)`
                          : "Selecionar membros"}
                      </span>
                      <ChevronsUpDown className="h-4 w-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-80">
                    <Command>
                      <CommandInput placeholder="Buscar usuário..." />
                      <CommandList>
                        <CommandEmpty>Nenhum usuário encontrado</CommandEmpty>
                        <CommandGroup>
                          {users.map((u) => {
                            const selected = teamForm.users.includes(u.id);
                            return (
                              <CommandItem
                                key={u.id}
                                onSelect={() => {
                                  setTeamForm((f) => {
                                    const set = new Set(f.users);
                                    selected ? set.delete(u.id) : set.add(u.id);
                                    return { ...f, users: Array.from(set) };
                                  });
                                }}
                                className="flex items-start gap-2"
                              >
                                <Checkbox
                                  checked={selected}
                                  className="mt-0.5"
                                  onCheckedChange={() => {
                                    setTeamForm((f) => {
                                      const set = new Set(f.users);
                                      selected ? set.delete(u.id) : set.add(u.id);
                                      return { ...f, users: Array.from(set) };
                                    });
                                  }}
                                />
                                <div>
                                  <div className="text-sm font-medium">
                                    {u.name || u.email}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {u.email}
                                  </div>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-wrap gap-2">
                  {teamForm.users.map((uid) => {
                    const member = users.find((u) => u.id === uid);
                    return (
                      <Badge key={uid} variant="secondary">
                        {member?.name || member?.email || uid}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsTeamDialogOpen(false);
                  resetTeamForm();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveTeam}>{teamForm.id ? "Atualizar" : "Criar"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Permissions Dialog */}
                <Dialog
          modal={false}
          open={showPermissionsDialog}
          onOpenChange={(open) => {
            setShowPermissionsDialog(open);
            if (!open) handleClosePermissionsDialog();
          }}
        >
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Permissões do usuário</DialogTitle>
              <DialogDescription>
                Ajuste as permissões individuais. Por padrão usamos o cargo: 
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
                      <p className="font-medium text-sm truncate">{selectedUser.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                  {permissionForm ? (
                    Object.entries(permissionForm).map(([permission, hasAccess]) => {
                      const label =
                        permissionLabels[permission as keyof UserPermissions] ||
                        permission
                          .replace("can", "")
                          .replace(/([A-Z])/g, " $1")
                          .trim();
                      const canEdit = hasPermission("canManageUsers");
                      return (
                        <div
                          key={permission}
                          className="flex items-center justify-between p-2 border rounded text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs truncate">{label}</p>
                          </div>
                          {canEdit ? (
                            <Switch
                              checked={hasAccess}
                              onCheckedChange={(checked) =>
                                setPermissionForm((prev) =>
                                  prev ? { ...prev, [permission]: Boolean(checked) } : prev,
                                )
                              }
                            />
                          ) : (
                            <Badge
                              variant={hasAccess ? "default" : "secondary"}
                              className="text-xs py-0 px-2 ml-2 flex-shrink-0"
                            >
                              {hasAccess ? "Permitido" : "Bloqueado"}
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">Carregando permissões...</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2 sticky bottom-0 bg-white pb-2">
                  <Button variant="outline" onClick={handleClosePermissionsDialog} className="flex-1">
                    Cancelar
                  </Button>
                  {hasPermission("canManageUsers") && (
                    <Button
                      className="flex-1"
                      onClick={handleSavePermissions}
                      disabled={savingPermissions || !permissionForm}
                    >
                      {savingPermissions ? "Salvando..." : "Salvar permissões"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>

    </Layout>

  );

}


