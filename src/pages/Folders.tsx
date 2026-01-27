import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Folder,
  CreateFolderData,
  FolderPermissions,
  folderColors,
  folderIcons,
} from "@/types/folder";
import { UserRole } from "@/types/auth";
import { foldersService } from "@/lib/services/folders";
import { usersService } from "@/lib/services/users";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Plus,
  FolderOpen,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Settings,
  Users,
  Archive,
  Building,
  Briefcase,
  Shield,
  Scale,
  FileText,
  Star,
  Heart,
  Lock,
  Globe,
  Zap,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { User } from "@/types/auth";

type PermissionMode = "all" | "roles" | "custom";
type FolderForm = CreateFolderData & { id?: string };

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admins" },
  { value: "manager", label: "Gerentes" },
  { value: "user", label: "Usuarios" },
];

const getIconComponent = (icon: string) => {
  const map: Record<string, any> = {
    FolderOpen,
    Folder: FolderOpen,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    Settings,
    Users,
    Archive,
    Building,
    Briefcase,
    Shield,
    Scale,
    FileText,
    Star,
    Heart,
    Lock,
    Globe,
    Zap,
  };
  return map[icon] || FolderOpen;
};

const getTotalContracts = (list?: Folder[]) => {
  const safe = Array.isArray(list) ? list : [];
  return safe.reduce((sum, f) => sum + (f.contractCount || 0), 0);
};

const normalizePermissions = (p?: Partial<FolderPermissions>): FolderPermissions => ({
  isPublic: Boolean(p?.isPublic ?? true),
  canView: Array.isArray(p?.canView) ? p!.canView : [],
  canEdit: Array.isArray(p?.canEdit) ? p!.canEdit : [],
  canManage: Array.isArray(p?.canManage) ? p!.canManage : [],
  viewRoles: Array.isArray(p?.viewRoles) ? p!.viewRoles : [],
  editRoles: Array.isArray(p?.editRoles) ? p!.editRoles : [],
  manageRoles: Array.isArray(p?.manageRoles) ? p!.manageRoles : [],
});

const derivePermissionMode = (perms: FolderPermissions): PermissionMode => {
  if (perms.isPublic) return "all";
  const hasCustomIds =
    perms.canView.length || perms.canEdit.length || perms.canManage.length;
  return hasCustomIds ? "custom" : "roles";
};

const defaultForm: FolderForm = {
  name: "",
  description: "",
  color: folderColors[0],
  icon: folderIcons[0],
  type: "custom",
  permissions: {
    isPublic: true,
    canView: [],
    canEdit: [],
    canManage: [],
    viewRoles: ["admin", "manager", "user"],
    editRoles: ["admin", "manager"],
    manageRoles: ["admin"],
  },
};

const parseFolder = (f: any): Folder => ({
  ...f,
  createdAt: new Date(f.createdAt),
  updatedAt: new Date(f.updatedAt),
});

const MultiUserSelector = ({
  label,
  selectedIds,
  users,
  onChange,
}: {
  label: string;
  selectedIds: string[];
  users: User[];
  onChange: (ids: string[]) => void;
}) => {
  const toggle = (id: string) => {
    const set = new Set(selectedIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange(Array.from(set));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span>
              {selectedIds.length
                ? `${selectedIds.length} selecionado(s)`
                : "Selecionar usuarios"}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-80">
          <Command>
            <CommandInput placeholder="Buscar usuario..." />
            <CommandList>
              <CommandEmpty>Nenhum usuario encontrado</CommandEmpty>
              <CommandGroup>
                {users.map((u) => (
                  <CommandItem
                    key={u.id}
                    onSelect={() => toggle(u.id)}
                    className="flex items-start gap-2"
                  >
                    <Checkbox
                      checked={selectedIds.includes(u.id)}
                      className="mt-0.5"
                      onCheckedChange={() => toggle(u.id)}
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
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="flex flex-wrap gap-2">
        {selectedIds.map((id) => {
          const user = users.find((u) => u.id === id);
          return (
            <Badge key={id} variant="secondary">
              {user?.name || user?.email || id}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

const PermissionsSection = ({
  mode,
  onModeChange,
  permissions,
  onPermissionsChange,
  users,
}: {
  mode: PermissionMode;
  onModeChange: (m: PermissionMode) => void;
  permissions: FolderPermissions;
  onPermissionsChange: (p: FolderPermissions) => void;
  users: User[];
}) => {
  const toggleRole = (field: "viewRoles" | "editRoles" | "manageRoles", role: UserRole) => {
    const current = new Set(permissions[field] || []);
    if (current.has(role)) current.delete(role);
    else current.add(role);
    onPermissionsChange({ ...permissions, [field]: Array.from(current) });
  };

  const updateIds = (field: "canView" | "canEdit" | "canManage", value: string) => {
    const ids = value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    onPermissionsChange({ ...permissions, [field]: ids });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Quem pode visualizar esta pasta?</Label>
        <RadioGroup
          value={mode}
          onValueChange={(val) => onModeChange(val as PermissionMode)}
          className="grid gap-2 md:grid-cols-3"
        >
          <Label className="flex gap-2 items-center border rounded-md px-3 py-2 cursor-pointer">
            <RadioGroupItem value="all" id="perm-all" />
            <div>
              <div className="font-medium">Todos</div>
              <div className="text-xs text-muted-foreground">
                Visivel para todos do ecossistema
              </div>
            </div>
          </Label>
          <Label className="flex gap-2 items-center border rounded-md px-3 py-2 cursor-pointer">
            <RadioGroupItem value="roles" id="perm-roles" />
            <div>
              <div className="font-medium">Por papel</div>
              <div className="text-xs text-muted-foreground">
                Admins, gerentes ou usuarios
              </div>
            </div>
          </Label>
          <Label className="flex gap-2 items-center border rounded-md px-3 py-2 cursor-pointer">
            <RadioGroupItem value="custom" id="perm-custom" />
            <div>
              <div className="font-medium">Personalizado</div>
              <div className="text-xs text-muted-foreground">
                Papeis + IDs especificos
              </div>
            </div>
          </Label>
        </RadioGroup>
      </div>

      {mode !== "all" && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Visualizar</Label>
            <div className="space-y-2">
              {roleOptions.map((opt) => (
                <label key={`view-${opt.value}`} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={permissions.viewRoles?.includes(opt.value)}
                    onCheckedChange={() => toggleRole("viewRoles", opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Editar</Label>
            <div className="space-y-2">
              {roleOptions.map((opt) => (
                <label key={`edit-${opt.value}`} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={permissions.editRoles?.includes(opt.value)}
                    onCheckedChange={() => toggleRole("editRoles", opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Gerenciar</Label>
            <div className="space-y-2">
              {roleOptions.map((opt) => (
                <label key={`manage-${opt.value}`} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={permissions.manageRoles?.includes(opt.value)}
                    onCheckedChange={() => toggleRole("manageRoles", opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === "custom" && (
        <div className="grid gap-4 md:grid-cols-3">
          <MultiUserSelector
            label="Usuarios que podem visualizar"
            users={users}
            selectedIds={permissions.canView}
            onChange={(ids) => onPermissionsChange({ ...permissions, canView: ids })}
          />
          <MultiUserSelector
            label="Usuarios que podem editar"
            users={users}
            selectedIds={permissions.canEdit}
            onChange={(ids) => onPermissionsChange({ ...permissions, canEdit: ids })}
          />
          <MultiUserSelector
            label="Usuarios que podem gerenciar"
            users={users}
            selectedIds={permissions.canManage}
            onChange={(ids) => onPermissionsChange({ ...permissions, canManage: ids })}
          />
        </div>
      )}
    </div>
  );
};

export default function Folders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<FolderForm>(defaultForm);
  const [permissionMode, setPermissionMode] = useState<PermissionMode>("all");
  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleFolders = useMemo(() => folders, [folders]);

  useEffect(() => {
    let mounted = true;
    const fetchFolders = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await foldersService.list();
        if (!mounted) return;
        const parsed = Array.isArray(data) ? data.map(parseFolder) : [];
        setFolders(parsed);
      } catch (error: any) {
        const msg = error?.message || "Erro ao carregar pastas";
        setError(msg);
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    const fetchUsers = async () => {
      try {
        const data = await usersService.list();
        if (!mounted) return;
        setUsers(data);
      } catch (error: any) {
        if (!mounted) return;
        console.error("Erro ao carregar usuarios", error?.message);
      }
    };
    fetchFolders();
    fetchUsers();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!folders.length) return;
    const searchParams = new URLSearchParams(location.search);
    const editId = searchParams.get("edit");
    if (editId) {
      const target = folders.find((f) => f.id === editId);
      if (target) {
        openEditDialog(target);
      }
    }
  }, [folders, location.search]);

  const openCreateDialog = () => {
    setDialogMode("create");
    setForm(defaultForm);
    setPermissionMode("all");
    setDialogOpen(true);
  };

  const canManageFolder = (f: Folder) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    const perms = normalizePermissions((f as any).permissions);
    const roleAllowed = (perms.manageRoles || []).includes(user.role as UserRole);
    const idAllowed = (perms.canManage || []).includes(user.id);
    return hasPermission("canManageFolders") && (roleAllowed || idAllowed || user.role === "manager");
  };

  const openEditDialog = (folder: Folder) => {
    const perms = normalizePermissions(folder.permissions);
    setDialogMode("edit");
    setForm({
      id: folder.id,
      name: folder.name,
      description: folder.description || "",
      color: folder.color,
      icon: folder.icon,
      type: folder.type,
      parentId: folder.parentId,
      permissions: perms,
    });
    setPermissionMode(derivePermissionMode(perms));
    setDialogOpen(true);
  };

  const updateFormField = <K extends keyof FolderForm>(key: K, value: FolderForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveFolder = async () => {
    if (!form.name.trim()) {
      toast.error("Nome da pasta e obrigatorio");
      return;
    }
    setSaving(true);
    try {
      const perms = normalizePermissions(form.permissions);
      const payloadPermissions: FolderPermissions =
        permissionMode === "all"
          ? {
              ...perms,
              isPublic: true,
              canView: [],
              canEdit: [],
              canManage: [],
              viewRoles: ["admin", "manager", "user"],
              editRoles: ["admin", "manager"],
              manageRoles: ["admin"],
            }
          : permissionMode === "roles"
            ? {
                ...perms,
                isPublic: false,
                canView: [],
                canEdit: [],
                canManage: [],
                viewRoles: perms.viewRoles.length ? perms.viewRoles : ["admin", "manager"],
                editRoles: perms.editRoles.length ? perms.editRoles : ["admin", "manager"],
                manageRoles: perms.manageRoles.length ? perms.manageRoles : ["admin"],
              }
            : {
                ...perms,
                isPublic: false,
                viewRoles: perms.viewRoles,
                editRoles: perms.editRoles,
                manageRoles: perms.manageRoles.length ? perms.manageRoles : ["admin"],
              };

      const payload: Partial<Folder> = {
        name: form.name,
        description: form.description,
        color: form.color,
        icon: form.icon,
        type: form.type,
        parentId: form.parentId,
        permissions: payloadPermissions,
      };

      if (dialogMode === "create") {
        const created = await foldersService.create(payload);
        setFolders((prev) => [...prev, parseFolder(created)]);
        toast.success("Pasta criada com sucesso");
      } else if (form.id) {
        const updated = await foldersService.update(form.id, payload);
        setFolders((prev) => prev.map((f) => (f.id === form.id ? parseFolder(updated) : f)));
        toast.success("Pasta atualizada");
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar pasta");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await foldersService.delete(deleteTarget.id);
      setFolders((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      toast.success("Pasta excluida");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao excluir pasta");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleFolderClick = (folder: Folder) => {
    navigate(`/folders/${folder.id}/contracts`);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pastas</h1>
            <p className="text-gray-600 mt-1">
              Organize seus contratos em pastas personalizadas
            </p>
          </div>

          {hasPermission("canCreateFolders") && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Pasta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>
                    {dialogMode === "create" ? "Criar Nova Pasta" : "Editar Pasta"}
                  </DialogTitle>
                  <DialogDescription>
                    Defina nome, icone e permissoes de acesso.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Pasta *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Contratos Comerciais"
                      value={form.name}
                      onChange={(e) => updateFormField("name", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descricao</Label>
                    <Textarea
                      id="description"
                      placeholder="Descricao opcional da pasta"
                      value={form.description}
                      onChange={(e) => updateFormField("description", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cor</Label>
                      <Select
                        value={form.color}
                        onValueChange={(value) => updateFormField("color", value)}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: form.color }}
                              />
                              Cor
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {folderColors.map((color) => (
                            <SelectItem key={color} value={color}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: color }}
                                />
                                {color}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Icone</Label>
                      <Select
                        value={form.icon}
                        onValueChange={(value) => updateFormField("icon", value)}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const IconComponent = getIconComponent(form.icon);
                                return <IconComponent className="h-4 w-4" />;
                              })()}
                              {form.icon}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {folderIcons.map((icon) => {
                            const IconComponent = getIconComponent(icon);
                            return (
                              <SelectItem key={icon} value={icon}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4" />
                                  {icon}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <PermissionsSection
                    mode={permissionMode}
                    onModeChange={setPermissionMode}
                    permissions={normalizePermissions(form.permissions)}
                    onPermissionsChange={(p) => updateFormField("permissions", p)}
                    users={users}
                  />

                  <Button onClick={saveFolder} className="w-full" disabled={saving}>
                    {saving ? "Salvando..." : dialogMode === "create" ? "Criar Pasta" : "Salvar alteracoes"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Pastas
              </CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visibleFolders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pastas Personalizadas
              </CardTitle>
              <Settings className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {visibleFolders.filter((f) => f.type === "custom").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Contratos
              </CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {getTotalContracts(visibleFolders)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pastas Ativas
              </CardTitle>
              <Eye className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {visibleFolders.filter((f) => f.isActive).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {loading && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Carregando pastas...
            </CardContent>
          </Card>
        )}

        {error && !loading && (
          <Card>
            <CardContent className="py-6 space-y-3">
              <div className="text-sm text-red-600">{error}</div>
              <Button size="sm" variant="outline" onClick={() => location.reload()}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleFolders.map((folder) => {
            const IconComponent = getIconComponent(folder.icon);

            return (
              <Card
                key={folder.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleFolderClick(folder)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: folder.color }}
                      >
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base truncate">
                          {folder.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              folder.type === "system" ? "secondary" : "outline"
                            }
                            className="text-xs"
                          >
                            {folder.type === "system"
                              ? "Sistema"
                              : "Personalizada"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFolderClick(folder);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Contratos
                        </DropdownMenuItem>
                        {folder.type !== "system" &&
                          canManageFolder(folder) && (
                            <>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(folder);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(folder);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {folder.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {folder.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {folder.contractCount} contratos
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(folder.updatedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {visibleFolders.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma pasta encontrada
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                Crie sua primeira pasta para organizar seus contratos
              </p>
              {hasPermission("canCreateFolders") && (
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Pasta
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pasta</AlertDialogTitle>
            <AlertDialogDescription>
              Confirme para remover a pasta "{deleteTarget?.name}". Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Confirmar exclusao
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
