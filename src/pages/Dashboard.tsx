import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Contract, ContractFilters } from "@/types/contract";
import {
  loadContractsFromStorage,
  saveContractsToStorage,
  filterContracts,
  getDashboardStats,
  getChartData,
  updateContractStatuses,
} from "@/lib/contracts";
import { exportWithOptions, exportPresets } from "@/lib/export";
import { ContractTable } from "@/components/contracts/ContractTable";
import { ContractCard } from "@/components/contracts/ContractCard";
import { ContractFilters as FiltersComponent } from "@/components/contracts/ContractFilters";
import { ContractImport } from "@/components/contracts/ContractImport";
import { ContractCharts } from "@/components/charts/ContractCharts";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Download,
  Grid3X3,
  TableIcon,
  BarChart3,
  Upload,
  Bell,
  Users,
  Clock,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/contracts";
import { mockUsers } from "@/contexts/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filters, setFilters] = useState<ContractFilters>({});
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showImport, setShowImport] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationData, setNotificationData] = useState({
    recipients: [] as string[],
    subject: "",
    message: "",
    contracts: [] as string[],
  });

  // Load contracts on mount
  useEffect(() => {
    const loadedContracts = loadContractsFromStorage();
    const updatedContracts = updateContractStatuses(loadedContracts);
    setContracts(updatedContracts);
    saveContractsToStorage(updatedContracts);
    setIsLoading(false);
  }, []);

  // Filter contracts
  const filteredContracts = filterContracts(contracts, filters);
  const stats = getDashboardStats(contracts);
  const chartData = getChartData(contracts);

  // Get unique values for filters
  const companies = [...new Set(contracts.map((c) => c.contractingCompany))];
  const responsibles = [
    ...new Set(contracts.map((c) => c.internalResponsible)),
  ];

  const handleContractParsed = (
    contractData: Partial<Contract>,
    file: File,
  ) => {
    const newContract: Contract = {
      id: crypto.randomUUID(),
      name: contractData.name || `Contrato ${file.name}`,
      description: contractData.description,
      contractingCompany: contractData.contractingCompany || "",
      contractedParty: contractData.contractedParty || "",
      startDate: contractData.startDate || new Date(),
      endDate: contractData.endDate || new Date(),
      value: contractData.value || 0,
      internalResponsible: contractData.internalResponsible || "",
      responsibleEmail: contractData.responsibleEmail || "",
      status: contractData.status || "active",
      fileName: file.name,
      fileType: file.name.endsWith(".pdf") ? "pdf" : "docx",
      filePath: `/contracts/${file.name}`,
      tags: [],
      priority: "medium",
      createdBy: user?.id || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: [],
      history: [
        {
          id: crypto.randomUUID(),
          contractId: "",
          action: "Contrato importado",
          author: user?.name || "Sistema",
          authorId: user?.id || "",
          timestamp: new Date(),
        },
      ],
      attachments: [],
      notifications: [],
      isArchived: false,
      permissions: {
        canView: [],
        canEdit: [],
        canComment: [],
        isPublic: true,
      },
    };

    const updatedContracts = [...contracts, newContract];
    setContracts(updatedContracts);
    saveContractsToStorage(updatedContracts);
    toast.success("Contrato adicionado com sucesso!");
  };

  const handleExport = async (format: "csv" | "pdf") => {
    try {
      const options = exportPresets.allContracts();
      await exportWithOptions(filteredContracts, format, options, chartData);
      toast.success(`Exportação ${format.toUpperCase()} iniciada!`);
    } catch (error) {
      toast.error("Erro ao exportar dados");
    }
  };

  const handleNotifyAll = () => {
    const expiring = contracts.filter(
      (c) => c.status === "expiring_soon" || c.status === "expired",
    );

    setNotificationData({
      recipients: [],
      subject:
        expiring.length > 0
          ? "Contratos Requerendo Atenção"
          : "Relatório de Contratos",
      message:
        expiring.length > 0
          ? `Existem ${expiring.length} contrato(s) que requerem sua atenção (vencendo em breve ou já vencidos).`
          : "Todos os contratos estão em dia. Este é um relatório de status.",
      contracts: expiring.map((c) => c.id),
    });

    setShowNotificationModal(true);
  };

  const handleSendNotification = () => {
    if (notificationData.recipients.length === 0) {
      toast.error("Selecione pelo menos um destinatário");
      return;
    }

    if (!notificationData.subject.trim()) {
      toast.error("Assunto é obrigatório");
      return;
    }

    // Simulate sending notification
    setTimeout(() => {
      toast.success(
        `Notificação enviada para ${notificationData.recipients.length} pessoa(s)`,
      );
      setShowNotificationModal(false);
      setNotificationData({
        recipients: [],
        subject: "",
        message: "",
        contracts: [],
      });
    }, 1000);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bem-vindo, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Aqui está um resumo dos seus contratos hoje
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hasPermission("canManageNotifications") && (
              <Button variant="outline" size="sm" onClick={handleNotifyAll}>
                <Bell className="h-4 w-4 mr-1" />
                Notificar
              </Button>
            )}

            {hasPermission("canCreateContracts") && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/contracts/new")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Contrato
                </Button>

                <Dialog open={showImport} onOpenChange={setShowImport}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Upload className="h-4 w-4 mr-1" />
                      Importar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Importar Contratos</DialogTitle>
                      <DialogDescription>
                        Faça upload de contratos em PDF ou DOCX para análise
                        automática
                      </DialogDescription>
                    </DialogHeader>
                    <ContractImport
                      onContractParsed={handleContractParsed}
                      onClose={() => setShowImport(false)}
                    />
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Contratos
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalContracts}</div>
              <p className="text-xs text-muted-foreground">
                +{Math.floor(Math.random() * 5) + 1} este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Contratos Ativos
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeContracts}
              </div>
              <p className="text-xs text-muted-foreground">
                {((stats.activeContracts / stats.totalContracts) * 100).toFixed(
                  1,
                )}
                % do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vencendo em Breve
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.expiringSoonContracts}
              </div>
              <p className="text-xs text-muted-foreground">Próximos 7 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Contratos Vencidos
              </CardTitle>
              <Clock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.expiredContracts}
              </div>
              <p className="text-xs text-muted-foreground">Requerem atenção</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">
                {formatCurrency(stats.totalValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Portfólio completo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger
                value="contracts"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Contratos
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Análises
              </TabsTrigger>
            </TabsList>

            {hasPermission("canExportData") && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("csv")}
                >
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("pdf")}
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Filters Section */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
                <CardDescription>
                  Filtre contratos por status, empresa ou responsável
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FiltersComponent
                  filters={filters}
                  onFiltersChange={setFilters}
                  companies={companies}
                  responsibles={responsibles}
                />
              </CardContent>
            </Card>

            {/* Contracts Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Contratos Recentes</CardTitle>
                <CardDescription>
                  {filteredContracts.length} contrato(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                  {filteredContracts.slice(0, 9).map((contract) => (
                    <ContractCard key={contract.id} contract={contract} />
                  ))}
                </div>
                {filteredContracts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhum contrato encontrado</p>
                    <p className="text-sm">
                      Ajuste os filtros ou importe novos contratos
                    </p>
                  </div>
                )}
                {filteredContracts.length > 9 && (
                  <div className="text-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/contracts")}
                    >
                      Ver todos os contratos ({filteredContracts.length})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            {/* Top Actions and View Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                {filteredContracts.length} de {contracts.length} contratos
              </div>
            </div>

            {/* Filters in horizontal layout */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <FiltersComponent
                  filters={filters}
                  onFiltersChange={setFilters}
                  companies={companies}
                  responsibles={responsibles}
                />
              </CardContent>
            </Card>

            {/* Contracts Content */}
            <div className="space-y-6">
              {viewMode === "table" ? (
                <ContractTable contracts={filteredContracts} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredContracts.map((contract) => (
                    <ContractCard key={contract.id} contract={contract} />
                  ))}
                </div>
              )}

              {filteredContracts.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhum contrato encontrado</p>
                    <p className="text-sm">
                      Ajuste os filtros ou importe novos contratos
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {hasPermission("canAccessAnalytics") ? (
              <ContractCharts chartData={chartData} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Acesso Restrito
                    </h3>
                    <p className="text-muted-foreground">
                      Você não tem permissão para acessar as análises.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Notification Modal */}
        <Dialog
          open={showNotificationModal}
          onOpenChange={setShowNotificationModal}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Enviar Notificação</DialogTitle>
              <DialogDescription>
                Configure e envie notificações sobre contratos para usuários
                selecionados
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 overflow-y-auto flex-1">
              {/* Recipients */}
              <div className="space-y-2">
                <Label>Destinatários *</Label>
                <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                  <div className="space-y-2">
                    {mockUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={notificationData.recipients.includes(
                            user.id,
                          )}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNotificationData((prev) => ({
                                ...prev,
                                recipients: [...prev.recipients, user.id],
                              }));
                            } else {
                              setNotificationData((prev) => ({
                                ...prev,
                                recipients: prev.recipients.filter(
                                  (id) => id !== user.id,
                                ),
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`user-${user.id}`} className="text-sm">
                          {user.name} ({user.email})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Selecionados: {notificationData.recipients.length} usuário(s)
                </p>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto *</Label>
                <Input
                  id="subject"
                  placeholder="Assunto da notificação"
                  value={notificationData.subject}
                  onChange={(e) =>
                    setNotificationData((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  placeholder="Mensagem adicional (opcional)"
                  value={notificationData.message}
                  onChange={(e) =>
                    setNotificationData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>

              {/* Contracts to include */}
              {notificationData.contracts.length > 0 && (
                <div className="space-y-2">
                  <Label>Contratos Incluídos</Label>
                  <div className="border rounded-lg p-3 bg-amber-50">
                    <p className="text-sm font-medium text-amber-800 mb-2">
                      {notificationData.contracts.length} contrato(s) serão
                      incluídos na notificação:
                    </p>
                    <div className="space-y-1">
                      {notificationData.contracts.map((contractId) => {
                        const contract = contracts.find(
                          (c) => c.id === contractId,
                        );
                        return contract ? (
                          <div
                            key={contractId}
                            className="text-xs text-amber-700"
                          >
                            • {contract.name} -{" "}
                            {contract.status === "expired"
                              ? "Vencido"
                              : "Vencendo em breve"}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowNotificationModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendNotification}
                className="flex-1"
                disabled={
                  notificationData.recipients.length === 0 ||
                  !notificationData.subject.trim()
                }
              >
                <Bell className="h-4 w-4 mr-2" />
                Enviar Notificação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
