import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Folder,
  FolderTree,
  CreateFolderData,
  folderColors,
  folderIcons,
  systemFolders,
} from "@/types/folder";
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
} from "lucide-react";
import { toast } from "sonner";

// Mock data for folders
const mockFolders: Folder[] = [
  {
    id: "system-1",
    name: "Todos os Contratos",
    description: "Todos os contratos do sistema",
    color: "#3B82F6",
    icon: "FolderOpen",
    path: [],
    type: "system",
    createdBy: "system",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
    contractCount: 12,
    isActive: true,
    permissions: { canView: [], canEdit: [], canManage: [], isPublic: true },
  },
  {
    id: "folder-1",
    name: "Contratos Comerciais",
    description: "Contratos de vendas e parcerias comerciais",
    color: "#10B981",
    icon: "Building",
    path: [],
    type: "custom",
    createdBy: "admin-1",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date(),
    contractCount: 8,
    isActive: true,
    permissions: { canView: [], canEdit: [], canManage: [], isPublic: true },
  },
  {
    id: "folder-2",
    name: "Contratos Trabalhistas",
    description: "Contratos de trabalho e CLT",
    color: "#F59E0B",
    icon: "Users",
    path: [],
    type: "custom",
    createdBy: "admin-1",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date(),
    contractCount: 4,
    isActive: true,
    permissions: { canView: [], canEdit: [], canManage: [], isPublic: true },
  },
  {
    id: "folder-3",
    name: "Prestação de Serviços",
    description: "Contratos de prestação de serviços diversos",
    color: "#8B5CF6",
    icon: "Briefcase",
    path: [],
    type: "custom",
    createdBy: "manager-1",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date(),
    contractCount: 6,
    isActive: true,
    permissions: { canView: [], canEdit: [], canManage: [], isPublic: true },
  },
];

export default function Folders() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFolder, setNewFolder] = useState<CreateFolderData>({
    name: "",
    description: "",
    color: folderColors[0],
    icon: folderIcons[0],
    type: "custom",
    permissions: { canView: [], canEdit: [], canManage: [], isPublic: true },
  });
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  useEffect(() => {
    // Load folders from storage or use mock data
    const storedFolders = localStorage.getItem("jurisync_folders");
    if (storedFolders) {
      try {
        const parsed = JSON.parse(storedFolders);
        setFolders(
          parsed.map((f: any) => ({
            ...f,
            createdAt: new Date(f.createdAt),
            updatedAt: new Date(f.updatedAt),
          })),
        );
      } catch {
        setFolders(mockFolders);
      }
    } else {
      setFolders(mockFolders);
    }
  }, []);

  const saveFolders = (updatedFolders: Folder[]) => {
    setFolders(updatedFolders);
    localStorage.setItem("jurisync_folders", JSON.stringify(updatedFolders));
  };

  const handleCreateFolder = () => {
    if (!newFolder.name.trim()) {
      toast.error("Nome da pasta é obrigatório");
      return;
    }

    const folder: Folder = {
      id: crypto.randomUUID(),
      ...newFolder,
      path: [],
      createdBy: user?.id || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      contractCount: 0,
      isActive: true,
    };

    const updatedFolders = [...folders, folder];
    saveFolders(updatedFolders);

    setNewFolder({
      name: "",
      description: "",
      color: folderColors[0],
      icon: folderIcons[0],
      type: "custom",
      permissions: { canView: [], canEdit: [], canManage: [], isPublic: true },
    });
    setShowCreateDialog(false);
    toast.success("Pasta criada com sucesso!");
  };

  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (folder?.type === "system") {
      toast.error("Pastas do sistema não podem ser excluídas");
      return;
    }

    const updatedFolders = folders.filter((f) => f.id !== folderId);
    saveFolders(updatedFolders);
    toast.success("Pasta excluída com sucesso!");
  };

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
    const IconComponent = icons[iconName] || FolderOpen;
    return IconComponent;
  };

  const getTotalContracts = () => {
    return folders.reduce((sum, folder) => sum + folder.contractCount, 0);
  };

  const handleFolderClick = (folder: Folder) => {
    navigate(`/folders/${folder.id}/contracts`);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pastas</h1>
            <p className="text-gray-600 mt-1">
              Organize seus contratos em pastas personalizadas
            </p>
          </div>

          {hasPermission("canCreateFolders") && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Pasta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Nova Pasta</DialogTitle>
                  <DialogDescription>
                    Organize seus contratos criando uma nova pasta
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Pasta *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Contratos Comerciais"
                      value={newFolder.name}
                      onChange={(e) =>
                        setNewFolder((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descrição opcional da pasta"
                      value={newFolder.description}
                      onChange={(e) =>
                        setNewFolder((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cor</Label>
                      <Select
                        value={newFolder.color}
                        onValueChange={(value) =>
                          setNewFolder((prev) => ({ ...prev, color: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: newFolder.color }}
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
                      <Label>Ícone</Label>
                      <Select
                        value={newFolder.icon}
                        onValueChange={(value) =>
                          setNewFolder((prev) => ({ ...prev, icon: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const IconComponent = getIconComponent(
                                  newFolder.icon,
                                );
                                return <IconComponent className="h-4 w-4" />;
                              })()}
                              {newFolder.icon}
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

                  <Button onClick={handleCreateFolder} className="w-full">
                    Criar Pasta
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Pastas
              </CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{folders.length}</div>
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
                {folders.filter((f) => f.type === "custom").length}
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
                {getTotalContracts()}
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
                {folders.filter((f) => f.isActive).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Folders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {folders.map((folder) => {
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
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
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
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
                          hasPermission("canManageFolders") && (
                            <>
                              <DropdownMenuItem
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFolder(folder.id);
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

        {folders.length === 0 && (
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
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Pasta
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
