
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Contract } from "@/types/contract";
import { formatDate, formatCurrency } from "@/lib/contracts";
import { ContractStatus } from "@/components/contracts/ContractStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  User,
  FileText,
  Download,
  Edit,
  MessageSquare,
  History,
  Mail,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { contractsService } from "@/lib/services/contracts";
import { API_URL } from "@/lib/api";
import { usersService } from "@/lib/services/users";
import { useAuth } from "@/contexts/AuthContext";

export default function ContractDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showFileModal, setShowFileModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [externalEmail, setExternalEmail] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyScope, setNotifyScope] = useState("contrato");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    description: "",
    status: "active",
    priority: "medium",
    internalResponsible: "",
    responsibleEmail: "",
  });
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      if (!id) return;
      try {
        const c = await contractsService.get(id);
        const comments = await contractsService.comments.list(id);
        const history = await contractsService.history.list(id);
        if (!mounted) return;
        setContract({
          ...c,
          startDate: new Date(c.startDate),
          endDate: new Date(c.endDate),
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          attachments: (c.attachments || []).map((a: any) => ({
            ...a,
            uploadedAt: a.uploadedAt ? new Date(a.uploadedAt) : new Date(),
          })),
          comments: comments.map((cm) => ({
            ...cm,
            createdAt: new Date(cm.createdAt),
          })),
          history: history.map((h) => ({
            ...h,
            timestamp: new Date(h.timestamp),
          })),
        });
        try {
          const userList = await usersService.list();
          if (!mounted) return;
          setUsers(
            userList.map((u: any) => ({
              ...u,
              createdAt: new Date(u.createdAt),
              updatedAt: new Date(u.updatedAt),
            })),
          );
        } catch (userErr: any) {
          if (!mounted) return;
          setUsers([]);
          if (userErr?.message && userErr.message !== "Acesso negado") {
            console.warn("Falha ao carregar usuários:", userErr.message);
          }
        }
      } catch (error: any) {
        if (mounted) toast.error(error?.message || "Contrato não encontrado");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [id]);
  const fileInfo = contract?.attachments?.[0] || null;
  const fileName = contract?.fileName || fileInfo?.fileName || fileInfo?.name;
  const fileType = contract?.fileType || fileInfo?.fileType;
  const filePath = contract?.filePath || fileInfo?.filePath;

  const handleOpenFile = () => {
    if (!filePath) return;
    setShowFileModal(true);
  };

  const handleDownload = () => {
    if (!filePath) return;
    window.open(`${API_URL}${filePath}`, "_blank", "noopener");
  };

  const handleOpenEdit = () => {
    if (!contract) return;
    setEditData({
      name: contract.name,
      description: contract.description || "",
      status: contract.status,
      priority: contract.priority,
      internalResponsible: contract.internalResponsible,
      responsibleEmail: contract.responsibleEmail,
    });
    setShowEditModal(true);
  };

  const persistAttachments = async (nextAttachments: any[]) => {
    if (!contract) return;
    const updated = await contractsService.update(contract.id, {
      attachments: nextAttachments,
    });
    setContract((prev) =>
      prev
        ? {
            ...prev,
            attachments: nextAttachments,
            updatedAt: new Date(updated.updatedAt),
          }
        : prev,
    );
  };
  const handleAddComment = async () => {
    if (!contract || !newComment.trim()) return;

    try {
      const created = await contractsService.comments.add(contract.id, {
        content: newComment.trim(),
      });
      const historyEntry = await contractsService.history.add(contract.id, {
        action: "Comentário adicionado",
        author: created.author,
      });

      const updatedContract = {
        ...contract,
        comments: [
          ...contract.comments,
          { ...created, createdAt: new Date(created.createdAt) },
        ],
        history: [
          ...contract.history,
          { ...historyEntry, timestamp: new Date(historyEntry.timestamp) },
        ],
        updatedAt: new Date(),
      };

      setContract(updatedContract);
      setNewComment("");
      toast.success("Comentário adicionado com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao adicionar comentário");
    }
  };
  const handleUploadAttachment = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!contract) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const uploaded = await contractsService.upload(file);
      const attachment = {
        id: crypto.randomUUID(),
        contractId: contract.id,
        name: uploaded.fileName,
        fileName: uploaded.fileName,
        fileType: uploaded.fileType,
        fileSize: uploaded.fileSize,
        uploadedBy: user?.name || "Sistema",
        uploadedAt: new Date(),
        filePath: uploaded.filePath,
      };
      const next = [...(contract.attachments || []), attachment];
      await persistAttachments(next);
      const historyEntry = await contractsService.history.add(contract.id, {
        action: "Documento adicionado",
        field: "attachments",
        newValue: uploaded.fileName,
        author: user?.name || "Sistema",
      });
      setContract((prev) =>
        prev
          ? {
              ...prev,
              attachments: next,
              history: [
                ...prev.history,
                { ...historyEntry, timestamp: new Date(historyEntry.timestamp) },
              ],
            }
          : prev,
      );
      toast.success("Documento adicionado");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar documento");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!contract) return;
    const target = (contract.attachments || []).find((a) => a.id === attachmentId);
    const next = (contract.attachments || []).filter((a) => a.id !== attachmentId);
    await persistAttachments(next);
    const historyEntry = await contractsService.history.add(contract.id, {
      action: "Documento removido",
      field: "attachments",
      oldValue: target?.fileName || "",
      author: user?.name || "Sistema",
    });
    setContract((prev) =>
      prev
        ? {
            ...prev,
            attachments: next,
            history: [
              ...prev.history,
              { ...historyEntry, timestamp: new Date(historyEntry.timestamp) },
            ],
          }
        : prev,
    );
    toast.success("Documento removido");
  };
  const handleSaveEdit = async () => {
    if (!contract) return;
    try {
      const updated = await contractsService.update(contract.id, {
        name: editData.name,
        description: editData.description,
        status: editData.status as any,
        priority: editData.priority as any,
        internalResponsible: editData.internalResponsible,
        responsibleEmail: editData.responsibleEmail,
      });
      const historyEntry = await contractsService.history.add(contract.id, {
        action: "Contrato atualizado",
        author: user?.name || "Sistema",
        metadata: { fields: ["name", "description", "status", "priority"] },
      });
      setContract((prev) =>
        prev
          ? {
              ...prev,
              ...updated,
              startDate: new Date(prev.startDate),
              endDate: new Date(prev.endDate),
              createdAt: new Date(prev.createdAt),
              updatedAt: new Date(updated.updatedAt),
              history: [
                ...prev.history,
                { ...historyEntry, timestamp: new Date(historyEntry.timestamp) },
              ],
            }
          : prev,
      );
      toast.success("Contrato atualizado");
      setShowEditModal(false);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar");
    }
  };
  const handleSendNotification = async () => {
    if (!contract) return;
    const recipients = [...selectedRecipients];
    if (externalEmail.trim()) recipients.push(externalEmail.trim());
    if (recipients.length === 0) {
      toast.error("Selecione ao menos um destinatário");
      return;
    }
    try {
      await contractsService.notifications.add(contract.id, {
        type: "custom",
        message: notifyMessage || `Notificação sobre ${notifyScope}`,
        recipients,
        scheduledFor: new Date(),
      } as any);
      const historyEntry = await contractsService.history.add(contract.id, {
        action: "Notificação enviada",
        author: user?.name || "Sistema",
        metadata: { recipients, scope: notifyScope },
      });
      setContract((prev) =>
        prev
          ? {
              ...prev,
              history: [
                ...prev.history,
                { ...historyEntry, timestamp: new Date(historyEntry.timestamp) },
              ],
            }
          : prev,
      );
      toast.success("Notificação enviada");
      setShowNotifyModal(false);
      setSelectedRecipients([]);
      setExternalEmail("");
      setNotifyMessage("");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar notificação");
    }
  };
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando contrato...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Contrato não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            O contrato solicitado não existe ou foi removido.
          </p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 truncate">
                  {contract.name}
                </h1>
                <p className="text-sm text-muted-foreground">ID: {contract.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ContractStatus status={contract.status} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotifyModal(true)}
              >
                <Mail className="h-4 w-4 mr-1" />
                Notificar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenFile}
                disabled={!filePath}
              >
                <Download className="h-4 w-4 mr-1" />
                Visualizar arquivo
              </Button>
              <Button size="sm" onClick={handleOpenEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informações do Contrato
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Empresa Contratante</p>
                      <p className="font-medium">{contract.contractingCompany}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Parte Contratada</p>
                      <p className="font-medium">{contract.contractedParty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Responsável Interno</p>
                      <p className="font-medium">{contract.internalResponsible}</p>
                      <p className="text-sm text-muted-foreground">{contract.responsibleEmail}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Início</p>
                      <p className="font-medium">{formatDate(contract.startDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Vencimento</p>
                      <p
                        className={`font-medium ${
                          contract.status === "expired"
                            ? "text-red-600"
                            : contract.status === "expiring_soon"
                              ? "text-yellow-600"
                              : "text-gray-900"
                        }`}
                      >
                        {formatDate(contract.endDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Valor do Contrato</p>
                      <p className="font-medium text-green-600 text-lg">
                        {formatCurrency(contract.value)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos do Contrato
                </CardTitle>
                <CardDescription>
                  Adicione, visualize ou remova documentos; cada ação gera histórico.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Faça upload de PDF/DOC/DOCX ou arraste arquivos.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="contract-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleUploadAttachment}
                      disabled={isUploading}
                    />
                    <Label
                      htmlFor="contract-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-muted text-sm"
                    >
                      <Upload className="h-4 w-4" />
                      {isUploading ? "Enviando..." : "Adicionar documento"}
                    </Label>
                  </div>
                </div>
                {(contract.attachments || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum documento adicionado.</p>
                ) : (
                  <div className="space-y-3">
                    {(contract.attachments || []).map((att) => (
                      <div key={att.id} className="flex items-center justify-between border rounded-md p-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{att.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {att.fileType?.toUpperCase()} • {att.uploadedAt ? formatDate(att.uploadedAt as any) : "Agora"}
                              {att.uploadedBy ? ` • por ${att.uploadedBy}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`${API_URL}${att.filePath}`, "_blank", "noopener")}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Abrir
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteAttachment(att.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comentários Internos
                </CardTitle>
                <CardDescription>
                  Adicione observações e notas sobre este contrato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Textarea
                    placeholder="Adicionar comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Adicionar Comentário
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  {contract.comments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhum comentário ainda. Seja o primeiro a comentar!
                    </p>
                  ) : (
                    contract.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(comment.author)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{comment.author}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" onClick={handleOpenEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Contrato
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setShowNotifyModal(true)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Notificar Responsável
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={handleOpenFile}
                  disabled={!filePath}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Visualizar arquivo
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contract.history
                    .slice(-5)
                    .reverse()
                    .map((entry) => (
                      <div key={entry.id} className="flex gap-3">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{entry.action}</p>
                          <div className="text-xs text-muted-foreground">
                            <p>{entry.author}</p>
                            <p>{formatDate(entry.timestamp)}</p>
                          </div>
                          {entry.field && (
                            <p className="text-xs text-gray-600">
                              {entry.field}: {entry.oldValue} ? {entry.newValue}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Criado em:</span>
                  <span className="text-sm font-medium">{formatDate(contract.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Atualizado em:</span>
                  <span className="text-sm font-medium">{formatDate(contract.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Comentários:</span>
                  <span className="text-sm font-medium">{contract.comments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Histórico:</span>
                  <span className="text-sm font-medium">{contract.history.length} eventos</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Dialog open={showFileModal} onOpenChange={setShowFileModal}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Visualizar documento</DialogTitle>
          </DialogHeader>
          {filePath ? (
            <div className="space-y-4">
              {fileType?.toLowerCase().includes("pdf") ? (
                <iframe
                  src={`${API_URL}${filePath}`}
                  className="w-full h-[70vh] border rounded-lg"
                  title={fileName || "Arquivo"}
                />
              ) : (
                <div className="p-4 bg-muted rounded-md text-sm">
                  Visualização não disponível para este formato. Baixe o arquivo para abrir.
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowFileModal(false)}>
                  Fechar
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Arquivo não disponível para este contrato.
            </p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={showNotifyModal} onOpenChange={setShowNotifyModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Notificar responsáveis</DialogTitle>
            <DialogDescription>
              Escolha usuários do sistema ou informe e-mails externos para receberem o aviso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Escopo</Label>
              <Select value={notifyScope} onValueChange={setNotifyScope}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o escopo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="upload">Upload</SelectItem>
                  <SelectItem value="informacoes">Informações gerais</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Descreva o que deve ser notificado"
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Selecionar usuários</Label>
              <Select
                value=""
                onValueChange={(val) => {
                  if (!selectedRecipients.includes(val)) {
                    setSelectedRecipients((prev) => [...prev, val]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha usuários" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.email}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRecipients.map((r) => (
                    <Badge key={r} variant="secondary" className="text-xs">
                      {r}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>E-mail externo (opcional)</Label>
              <Input
                placeholder="email@exemplo.com"
                value={externalEmail}
                onChange={(e) => setExternalEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNotifyModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendNotification}>Enviar notificação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar contrato</DialogTitle>
            <DialogDescription>
              Atualize os dados principais. Alterações são registradas no histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={editData.status}
                  onValueChange={(val) => setEditData((p) => ({ ...p, status: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="expiring_soon">Vencendo</SelectItem>
                    <SelectItem value="expired">Vencido</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Prioridade</Label>
                <Select
                  value={editData.priority}
                  onValueChange={(val) => setEditData((p) => ({ ...p, priority: val }))}
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
            </div>
            <div className="space-y-1">
              <Label>Responsável interno</Label>
              <Input
                value={editData.internalResponsible}
                onChange={(e) => setEditData((p) => ({ ...p, internalResponsible: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>E-mail do responsável</Label>
              <Input
                value={editData.responsibleEmail}
                onChange={(e) => setEditData((p) => ({ ...p, responsibleEmail: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

