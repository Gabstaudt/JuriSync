import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Contract,
  ContractComment,
  ContractHistoryEntry,
} from "@/types/contract";
import { formatDate, formatCurrency } from "@/lib/contracts";
import { ContractStatus } from "@/components/contracts/ContractStatus";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Phone,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { contractsService } from "@/lib/services/contracts";

export default function ContractDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const c = await contractsService.get(id);
        const comments = await contractsService.comments.list(id);
        const history = await contractsService.history.list(id);
        setContract({
          ...c,
          startDate: new Date(c.startDate),
          endDate: new Date(c.endDate),
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          comments: comments.map((cm) => ({
            ...cm,
            createdAt: new Date(cm.createdAt),
          })),
          history: history.map((h) => ({
            ...h,
            timestamp: new Date(h.timestamp),
          })),
        });
      } catch (error: any) {
        toast.error(error?.message || "Contrato n?o encontrado");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);


  const handleAddComment = async () => {
    if (!contract || !newComment.trim()) return;

    try {
      const created = await contractsService.comments.add(contract.id, {
        content: newComment.trim(),
      });
      const historyEntry = await contractsService.history.add(contract.id, {
        action: "Coment?rio adicionado",
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
      toast.success("Coment?rio adicionado com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao adicionar coment?rio");
    }
  };

  const handleDownload = () => {
    if (contract?.fileName) {
      toast.success(`Download de ${contract.fileName} iniciado`);
    } else {
      toast.error("Arquivo não disponível");
    }
  };

  const handleNotifyResponsible = () => {
    if (contract) {
      toast.success(`Notificação enviada para ${contract.internalResponsible}`);
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
          <h2 className="text-2xl font-semibold mb-2">
            Contrato não encontrado
          </h2>
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
      {/* Header */}
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
                <p className="text-sm text-muted-foreground">
                  ID: {contract.id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ContractStatus status={contract.status} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleNotifyResponsible}
              >
                <Mail className="h-4 w-4 mr-1" />
                Notificar
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Details */}
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
                      <p className="text-sm text-muted-foreground">
                        Empresa Contratante
                      </p>
                      <p className="font-medium">
                        {contract.contractingCompany}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Parte Contratada
                      </p>
                      <p className="font-medium">{contract.contractedParty}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Responsável Interno
                      </p>
                      <p className="font-medium">
                        {contract.internalResponsible}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {contract.responsibleEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Data de Início
                      </p>
                      <p className="font-medium">
                        {formatDate(contract.startDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Data de Vencimento
                      </p>
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
                      <p className="text-sm text-muted-foreground">
                        Valor do Contrato
                      </p>
                      <p className="font-medium text-green-600 text-lg">
                        {formatCurrency(contract.value)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Information */}
            {contract.fileName && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Arquivo do Contrato
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{contract.fileName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {contract.fileType?.toUpperCase()}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            Carregado em {formatDate(contract.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
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
                {/* Add Comment */}
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

                {/* Comments List */}
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
                            <p className="text-sm font-medium">
                              {comment.author}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-700">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Contrato
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={handleNotifyResponsible}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Notificar Responsável
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download do Arquivo
                </Button>
              </CardContent>
            </Card>

            {/* Contract History */}
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
                              {entry.field}: {entry.oldValue} → {entry.newValue}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Contract Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Criado em:
                  </span>
                  <span className="text-sm font-medium">
                    {formatDate(contract.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Atualizado em:
                  </span>
                  <span className="text-sm font-medium">
                    {formatDate(contract.updatedAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Comentários:
                  </span>
                  <span className="text-sm font-medium">
                    {contract.comments.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Histórico:
                  </span>
                  <span className="text-sm font-medium">
                    {contract.history.length} eventos
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
