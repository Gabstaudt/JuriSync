import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CreateContractData, ContractPriority } from "@/types/contract";
import { Folder } from "@/types/folder";
import { User } from "@/types/auth";
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
import { contractsService } from "@/lib/services/contracts";
import { foldersService } from "@/lib/services/folders";
import { usersService } from "@/lib/services/users";
import { companiesService, partiesService } from "@/lib/services/companies";
import { Company, Party } from "@/types/company";

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
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string;
    fileType: string;
    fileSize: number;
    filePath: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [showNewCompanyDialog, setShowNewCompanyDialog] = useState(false);
  const [showNewPartyDialog, setShowNewPartyDialog] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: "", cnpj: "", email: "", phone: "" });
  const [newParty, setNewParty] = useState({ name: "", role: "", email: "", phone: "", companyId: "" });
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
    const fetchData = async () => {
      try {
        const [folderData, userData, companyData, partyData] = await Promise.all([
          foldersService.list(),
          usersService.list(),
          companiesService.list(),
          partiesService.list(),
        ]);
        setFolders(
          folderData
            .filter((f) => f.type === "custom")
            .map((f) => ({
              ...f,
              createdAt: new Date(f.createdAt),
              updatedAt: new Date(f.updatedAt),
            })),
        );
        setUsers(
          userData.map((u) => ({
            ...u,
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),
          })),
        );
        setCompanies(companyData);
        setParties(partyData);
      } catch (error: any) {
        toast.error(error?.message || "Erro ao carregar dados");
      }
    };
    fetchData();
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

  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(pdf|doc|docx)$/i)) {
      toast.error("Apenas PDF, DOC ou DOCX s?o permitidos");
      return;
    }
    setIsUploading(true);
    try {
      const uploaded = await contractsService.upload(file);
      setUploadedFile(uploaded);
      toast.success("Arquivo enviado com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao enviar arquivo");
    } finally {
      setIsUploading(false);
    }
  };
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    setIsLoading(true);

    try {
      await contractsService.create({
        name: formData.name,
        description: formData.description,
        contractingCompany: formData.contractingCompany,
        contractedParty: formData.contractedParty,
        startDate: formData.startDate,
        endDate: formData.endDate,
        value: formData.value,
        internalResponsible: formData.internalResponsible,
        responsibleEmail: formData.responsibleEmail,
        folderId: addToFolder ? formData.folderId : undefined,
        tags: formData.tags,
        priority: formData.priority,
        permissions: formData.permissions,
        attachments: uploadedFile
          ? [
              {
                id: crypto.randomUUID(),
                contractId: "",
                name: uploadedFile.fileName,
                fileName: uploadedFile.fileName,
                fileType: uploadedFile.fileType,
                fileSize: uploadedFile.fileSize,
                uploadedBy: user?.id || "",
                uploadedAt: new Date(),
                filePath: uploadedFile.filePath,
              },
            ]
          : [],
        fileName: uploadedFile?.fileName,
        filePath: uploadedFile?.filePath,
        fileType: uploadedFile?.fileType as any,
        status: "active",
      });
      toast.success("Contrato criado com sucesso!");
      navigate("/contracts");
    } catch (error) {
      toast.error((error as any)?.message || "Erro ao criar contrato");
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
      toast.error("Nome da pasta e obrigatorio");
      return;
    }

    try {
      const created = await foldersService.create({
        name: newFolderName,
        description: `Pasta criada durante criacao do contrato "${formData.name || newFolderName}"`,
        color: "#3B82F6",
        icon: "FolderOpen",
        type: "custom",
        permissions: {
          canView: [],
          canEdit: [],
          canManage: [],
          isPublic: true,
        },
      });
      setFolders((prev) => [...prev, created]);
      setFormData((prev) => ({ ...prev, folderId: created.id }));
      setNewFolderName("");
      setShowNewFolderDialog(false);
      toast.success("Pasta criada com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao criar pasta");
    }
  };

  const handleCreateCompanyInline = async () => {
    if (!newCompany.name.trim()) return toast.error("Nome da empresa é obrigatório");
    try {
      const created = await companiesService.create(newCompany);
      setCompanies((prev) => [created, ...prev]);
      updateFormData("contractingCompany", created.name);
      setNewCompany({ name: "", cnpj: "", email: "", phone: "" });
      setShowNewCompanyDialog(false);
      toast.success("Empresa criada");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao criar empresa");
    }
  };

  const handleCreatePartyInline = async () => {
    if (!newParty.name.trim() || !newParty.role.trim()) {
      toast.error("Nome e papel da parte são obrigatórios");
      return;
    }
    try {
      const created = await partiesService.create({
        name: newParty.name,
        role: newParty.role,
        email: newParty.email,
        phone: newParty.phone,
        companyId: newParty.companyId || null,
      });
      setParties((prev) => [created, ...prev]);
      updateFormData("contractedParty", created.name);
      setNewParty({ name: "", role: "", email: "", phone: "", companyId: "" });
      setShowNewPartyDialog(false);
      toast.success("Parte criada");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao criar parte");
    }
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
                  <Label htmlFor="contractingCompany">Empresa Contratante *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.contractingCompany}
                      onValueChange={(val) => updateFormData("contractingCompany", val)}
                    >
                      <SelectTrigger className={errors.contractingCompany ? "border-red-500 flex-1" : "flex-1"}>
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={() => setShowNewCompanyDialog(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.contractingCompany && (
                    <p className="text-sm text-red-600">{errors.contractingCompany}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractedParty">Parte Contratada *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.contractedParty}
                      onValueChange={(val) => updateFormData("contractedParty", val)}
                    >
                      <SelectTrigger className={errors.contractedParty ? "border-red-500 flex-1" : "flex-1"}>
                        <SelectValue placeholder="Selecione a parte" />
                      </SelectTrigger>
                      <SelectContent>
                        {parties.map((p) => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={() => setShowNewPartyDialog(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.contractedParty && (
                    <p className="text-sm text-red-600">{errors.contractedParty}</p>
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
                  <Select
                    value={formData.internalResponsible}
                    onValueChange={(val) => {
                      const selected = users.find(
                        (u) => u.name === val || u.id === val,
                      );
                      const name = selected ? selected.name : val;
                      const email = selected?.email || "";
                      updateFormData("internalResponsible", name);
                      if (email) updateFormData("responsibleEmail", email);
                    }}
                  >
                    <SelectTrigger
                      id="internalResponsible"
                      className={
                        errors.internalResponsible ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.name}>
                          {u.name} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                Fa?a upload do contrato (PDF/DOC/DOCX) ou arraste para a ?rea
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  id="documents"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <label htmlFor="documents" className="cursor-pointer block space-y-2">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">
                    Clique para selecionar documentos ou arraste arquivos aqui
                  </p>
                  <p className="text-xs text-gray-400">
                    PDF, DOCX, DOC (m?x. 10MB cada)
                  </p>
                </label>
              </div>

              {isUploading && (
                <p className="text-xs text-muted-foreground">Enviando arquivo...</p>
              )}

              {uploadedFile && (
                <div className="flex items-center justify-between border rounded-lg p-3 bg-green-50 border-green-200">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        {uploadedFile.fileName}
                      </p>
                      <p className="text-xs text-green-700">
                        {Math.round(uploadedFile.fileSize / 1024)} KB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                <p>? Apenas um arquivo principal por contrato.</p>
                <p>? O arquivo fica associado e pode ser baixado na visualiza??o.</p>
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
      <Dialog open={showNewCompanyDialog} onOpenChange={setShowNewCompanyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova empresa</DialogTitle>
            <DialogDescription>Cadastre rapidamente e continue o contrato.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              placeholder="Nome da empresa"
              value={newCompany.name}
              onChange={(e) => setNewCompany((p) => ({ ...p, name: e.target.value }))}
            />
            <Input
              placeholder="CNPJ"
              value={newCompany.cnpj}
              onChange={(e) => setNewCompany((p) => ({ ...p, cnpj: e.target.value }))}
            />
            <Input
              placeholder="E-mail"
              value={newCompany.email}
              onChange={(e) => setNewCompany((p) => ({ ...p, email: e.target.value }))}
            />
            <Input
              placeholder="Telefone"
              value={newCompany.phone}
              onChange={(e) => setNewCompany((p) => ({ ...p, phone: e.target.value }))}
            />
            <Button onClick={handleCreateCompanyInline}>Salvar empresa</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewPartyDialog} onOpenChange={setShowNewPartyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova parte</DialogTitle>
            <DialogDescription>Cadastre rapidamente e continue o contrato.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              placeholder="Nome da parte"
              value={newParty.name}
              onChange={(e) => setNewParty((p) => ({ ...p, name: e.target.value }))}
            />
            <Input
              placeholder="Papel (ex: Representante)"
              value={newParty.role}
              onChange={(e) => setNewParty((p) => ({ ...p, role: e.target.value }))}
            />
            <Input
              placeholder="E-mail"
              value={newParty.email}
              onChange={(e) => setNewParty((p) => ({ ...p, email: e.target.value }))}
            />
            <Input
              placeholder="Telefone"
              value={newParty.phone}
              onChange={(e) => setNewParty((p) => ({ ...p, phone: e.target.value }))}
            />
            <Select
              value={newParty.companyId}
              onValueChange={(val) => setNewParty((p) => ({ ...p, companyId: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vincular empresa (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreatePartyInline}>Salvar parte</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
