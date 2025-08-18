import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CreateContractData, ContractPriority } from "@/types/contract";
import { Folder } from "@/types/folder";
import { User } from "@/types/auth";
import { mockUsers } from "@/contexts/AuthContext";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Save,
  FileText,
  Building,
  User as UserIcon,
  DollarSign,
  Flag,
  FolderOpen,
  Shield,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function NewContract() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [addToFolder, setAddToFolder] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [formData, setFormData] = useState<CreateContractData>({
    name: "",
    description: "",
    contractingCompany: "",
    contractedParty: "",
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    value: 0,
    internalResponsible: user?.name || "",
    responsibleEmail: user?.email || "",
    folderId: undefined,
    tags: [],
    priority: "medium",
    permissions: {
      canView: [],
      canEdit: [],
      canComment: [],
      isPublic: true,
    },
  });
  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load folders and users
    const storedFolders = localStorage.getItem("jurisync_folders");
    if (storedFolders) {
      try {
        const parsed = JSON.parse(storedFolders);
        setFolders(parsed.filter((f: Folder) => f.type === "custom"));
      } catch {
        setFolders([]);
      }
    }

    // Use mock users for now
    setUsers(mockUsers);
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim())
      newErrors.name = "Nome do contrato é obrigatório";
    if (!formData.contractingCompany.trim())
      newErrors.contractingCompany = "Empresa contratante é obrigatória";
    if (!formData.contractedParty.trim())
      newErrors.contractedParty = "Parte contratada é obrigatória";
    if (!formData.internalResponsible.trim())
      newErrors.internalResponsible = "Responsável interno é obrigatório";
    if (!formData.responsibleEmail.trim())
      newErrors.responsibleEmail = "E-mail do responsável é obrigatório";
    if (formData.value <= 0) newErrors.value = "Valor deve ser maior que zero";
    if (formData.endDate <= formData.startDate)
      newErrors.endDate =
        "Data de vencimento deve ser posterior à data de início";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      formData.responsibleEmail &&
      !emailRegex.test(formData.responsibleEmail)
    ) {
      newErrors.responsibleEmail = "E-mail inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create contract object
      const newContract = {
        id: crypto.randomUUID(),
        ...formData,
        folderId: addToFolder ? formData.folderId : undefined,
        folderPath:
          addToFolder && formData.folderId
            ? [getSelectedFolder()?.name || ""]
            : undefined,
        status: "active" as const,
        createdBy: user?.id || "",
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: [],
        history: [
          {
            id: crypto.randomUUID(),
            contractId: "",
            action: "Contrato criado",
            author: user?.name || "Sistema",
            authorId: user?.id || "",
            timestamp: new Date(),
          },
        ],
        attachments: [],
        notifications: [],
        isArchived: false,
      };

      // Save to localStorage (in production, this would be an API call)
      const existingContracts = JSON.parse(
        localStorage.getItem("jurisync_contracts") || "[]",
      );
      const updatedContracts = [...existingContracts, newContract];
      localStorage.setItem(
        "jurisync_contracts",
        JSON.stringify(updatedContracts),
      );

      // Update folder contract count if adding to folder
      if (addToFolder && formData.folderId) {
        const existingFolders = JSON.parse(
          localStorage.getItem("jurisync_folders") || "[]",
        );
        const updatedFolders = existingFolders.map((f: Folder) =>
          f.id === formData.folderId
            ? {
                ...f,
                contractCount: f.contractCount + 1,
                updatedAt: new Date(),
              }
            : f,
        );
        localStorage.setItem(
          "jurisync_folders",
          JSON.stringify(updatedFolders),
        );
      }

      toast.success("Contrato criado com sucesso!");
      navigate("/contracts");
    } catch (error) {
      toast.error("Erro ao criar contrato");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const updateFormData = (field: keyof CreateContractData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleCreateNewFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Nome da pasta é obrigatório");
      return;
    }

    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name: newFolderName,
      description: `Pasta criada durante criação do contrato "${formData.name}"`,
      color: "#3B82F6",
      icon: "FolderOpen",
      path: [],
      type: "custom",
      createdBy: user?.id || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      contractCount: 0,
      isActive: true,
      permissions: {
        canView: [],
        canEdit: [],
        canManage: [],
        isPublic: true,
      },
    };

    // Save folder
    const existingFolders = JSON.parse(
      localStorage.getItem("jurisync_folders") || "[]",
    );
    const updatedFolders = [...existingFolders, newFolder];
    localStorage.setItem("jurisync_folders", JSON.stringify(updatedFolders));

    setFolders((prev) => [...prev, newFolder]);
    setFormData((prev) => ({ ...prev, folderId: newFolder.id }));
    setNewFolderName("");
    setShowNewFolderDialog(false);
    toast.success("Pasta criada com sucesso!");
  };

  const handlePermissionChange = (
    userId: string,
    permission: "canView" | "canEdit" | "canComment",
    checked: boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: checked
          ? [...prev.permissions[permission], userId]
          : prev.permissions[permission].filter((id) => id !== userId),
      },
    }));
  };

  const getSelectedFolder = () => {
    return folders.find((f) => f.id === formData.folderId);
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Contrato</h1>
            <p className="text-gray-600 mt-1">
              Crie um novo contrato preenchendo as informações abaixo
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
              <CardDescription>Dados principais do contrato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Contrato *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Contrato de Prestação de Serviços - TI"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descrição detalhada do contrato"
                  value={formData.description}
                  onChange={(e) =>
                    updateFormData("description", e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractingCompany">
                    Empresa Contratante *
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="contractingCompany"
                      placeholder="Nome da empresa contratante"
                      value={formData.contractingCompany}
                      onChange={(e) =>
                        updateFormData("contractingCompany", e.target.value)
                      }
                      className={`pl-10 ${errors.contractingCompany ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.contractingCompany && (
                    <p className="text-sm text-red-600">
                      {errors.contractingCompany}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractedParty">Parte Contratada *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="contractedParty"
                      placeholder="Nome da parte contratada"
                      value={formData.contractedParty}
                      onChange={(e) =>
                        updateFormData("contractedParty", e.target.value)
                      }
                      className={`pl-10 ${errors.contractedParty ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.contractedParty && (
                    <p className="text-sm text-red-600">
                      {errors.contractedParty}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates and Value */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Prazos e Valores
              </CardTitle>
              <CardDescription>
                Defina as datas e valor do contrato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Início *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate
                          ? format(formData.startDate, "dd/MM/yyyy")
                          : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) =>
                          date && updateFormData("startDate", date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data de Vencimento *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.endDate && "text-muted-foreground",
                          errors.endDate && "border-red-500",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate
                          ? format(formData.endDate, "dd/MM/yyyy")
                          : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) =>
                          date && updateFormData("endDate", date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.endDate && (
                    <p className="text-sm text-red-600">{errors.endDate}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Valor do Contrato (R$) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="value"
                    type="number"
                    placeholder="0,00"
                    value={formData.value || ""}
                    onChange={(e) =>
                      updateFormData("value", parseFloat(e.target.value) || 0)
                    }
                    className={`pl-10 ${errors.value ? "border-red-500" : ""}`}
                    step="0.01"
                    min="0"
                  />
                </div>
                {errors.value && (
                  <p className="text-sm text-red-600">{errors.value}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Responsible and Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Responsabilidade e Prioridade
              </CardTitle>
              <CardDescription>
                Defina quem será responsável pelo contrato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="internalResponsible">
                    Responsável Interno *
                  </Label>
                  <Input
                    id="internalResponsible"
                    placeholder="Nome do responsável"
                    value={formData.internalResponsible}
                    onChange={(e) =>
                      updateFormData("internalResponsible", e.target.value)
                    }
                    className={
                      errors.internalResponsible ? "border-red-500" : ""
                    }
                  />
                  {errors.internalResponsible && (
                    <p className="text-sm text-red-600">
                      {errors.internalResponsible}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsibleEmail">
                    E-mail do Responsável *
                  </Label>
                  <Input
                    id="responsibleEmail"
                    type="email"
                    placeholder="email@empresa.com"
                    value={formData.responsibleEmail}
                    onChange={(e) =>
                      updateFormData("responsibleEmail", e.target.value)
                    }
                    className={errors.responsibleEmail ? "border-red-500" : ""}
                  />
                  {errors.responsibleEmail && (
                    <p className="text-sm text-red-600">
                      {errors.responsibleEmail}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    updateFormData("priority", value as ContractPriority)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Folder Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Organização em Pasta
              </CardTitle>
              <CardDescription>
                Organize o contrato em uma pasta específica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="addToFolder"
                  checked={addToFolder}
                  onCheckedChange={setAddToFolder}
                />
                <Label htmlFor="addToFolder">Adicionar a uma pasta</Label>
              </div>

              {addToFolder && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-2">
                    <Label>Selecionar Pasta</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.folderId || "none"}
                        onValueChange={(value) =>
                          updateFormData(
                            "folderId",
                            value === "none" ? undefined : value,
                          )
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Escolha uma pasta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma pasta</SelectItem>
                          {folders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: folder.color }}
                                />
                                {folder.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Dialog
                        open={showNewFolderDialog}
                        onOpenChange={setShowNewFolderDialog}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" type="button">
                            <Plus className="h-4 w-4 mr-2" />
                            Nova
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Criar Nova Pasta</DialogTitle>
                            <DialogDescription>
                              Crie uma nova pasta para organizar seus contratos
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="newFolderName">
                                Nome da Pasta
                              </Label>
                              <Input
                                id="newFolderName"
                                placeholder="Ex: Contratos Comerciais"
                                value={newFolderName}
                                onChange={(e) =>
                                  setNewFolderName(e.target.value)
                                }
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setShowNewFolderDialog(false)}
                                className="flex-1"
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleCreateNewFolder}
                                className="flex-1"
                              >
                                Criar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {getSelectedFolder() && (
                    <div className="p-3 bg-white border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{
                            backgroundColor: getSelectedFolder()?.color,
                          }}
                        />
                        <span className="font-medium">
                          {getSelectedFolder()?.name}
                        </span>
                      </div>
                      {getSelectedFolder()?.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {getSelectedFolder()?.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos
              </CardTitle>
              <CardDescription>
                Adicione documentos relacionados ao contrato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  id="documents"
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      toast.success(
                        `${files.length} documento(s) adicionado(s)`,
                      );
                    }
                  }}
                />
                <label htmlFor="documents" className="cursor-pointer">
                  <div className="space-y-2">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      Clique para selecionar documentos ou arraste arquivos aqui
                    </p>
                    <p className="text-xs text-gray-400">
                      PDF, DOCX, DOC, TXT, JPG, PNG (máx. 10MB cada)
                    </p>
                  </div>
                </label>
              </div>

              <div className="text-xs text-gray-500">
                <p>
                  • Você pode adicionar contratos assinados, anexos e documentos
                  de suporte
                </p>
                <p>
                  • Os documentos serão armazenados com segurança e associados
                  ao contrato
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Tags e Classificação
              </CardTitle>
              <CardDescription>
                Adicione tags para melhor organização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Adicionar
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permissões de Acesso
              </CardTitle>
              <CardDescription>
                Configure quem pode visualizar e editar este contrato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={formData.permissions.isPublic}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      permissions: { ...prev.permissions, isPublic: checked },
                    }))
                  }
                />
                <Label htmlFor="isPublic">
                  Acesso público (todos os usuários)
                </Label>
              </div>

              {!formData.permissions.isPublic && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Permissões Específicas</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPermissionsDialog(true)}
                      type="button"
                    >
                      Configurar
                    </Button>
                  </div>

                  {(formData.permissions.canView.length > 0 ||
                    formData.permissions.canEdit.length > 0 ||
                    formData.permissions.canComment.length > 0) && (
                    <div className="space-y-2">
                      {formData.permissions.canView.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">
                            Podem visualizar:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {formData.permissions.canView.map((userId) => {
                              const user = users.find((u) => u.id === userId);
                              return user ? (
                                <Badge
                                  key={userId}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {user.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {formData.permissions.canEdit.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">
                            Podem editar:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {formData.permissions.canEdit.map((userId) => {
                              const user = users.find((u) => u.id === userId);
                              return user ? (
                                <Badge
                                  key={userId}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {user.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Permissions Dialog */}
              <Dialog
                open={showPermissionsDialog}
                onOpenChange={setShowPermissionsDialog}
              >
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Configurar Permissões</DialogTitle>
                    <DialogDescription>
                      Selecione quais usuários podem acessar este contrato
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`view-${user.id}`}
                              checked={formData.permissions.canView.includes(
                                user.id,
                              )}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(
                                  user.id,
                                  "canView",
                                  !!checked,
                                )
                              }
                            />
                            <Label
                              htmlFor={`view-${user.id}`}
                              className="text-xs"
                            >
                              Ver
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-${user.id}`}
                              checked={formData.permissions.canEdit.includes(
                                user.id,
                              )}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(
                                  user.id,
                                  "canEdit",
                                  !!checked,
                                )
                              }
                            />
                            <Label
                              htmlFor={`edit-${user.id}`}
                              className="text-xs"
                            >
                              Editar
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`comment-${user.id}`}
                              checked={formData.permissions.canComment.includes(
                                user.id,
                              )}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(
                                  user.id,
                                  "canComment",
                                  !!checked,
                                )
                              }
                            />
                            <Label
                              htmlFor={`comment-${user.id}`}
                              className="text-xs"
                            >
                              Comentar
                            </Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => setShowPermissionsDialog(false)}
                    className="w-full"
                  >
                    Salvar Permissões
                  </Button>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Criar Contrato
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
