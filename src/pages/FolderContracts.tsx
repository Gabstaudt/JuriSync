import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Contract, ContractFilters } from "@/types/contract";
import { Folder } from "@/types/folder";
import { filterContracts, formatCurrency } from "@/lib/contracts";
import { ContractTable } from "@/components/contracts/ContractTable";
import { ContractCard } from "@/components/contracts/ContractCard";
import { ContractFilters as FiltersComponent } from "@/components/contracts/ContractFilters";
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
import {
  ArrowLeft,
  FolderOpen,
  Plus,
  Grid3X3,
  TableIcon,
  FileText,
  Building,
  Users,
  Settings,
  Star,
  Archive,
  Briefcase,
  Shield,
  Scale,
  Heart,
  Lock,
  Globe,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { foldersService } from "@/lib/services/folders";
import { contractsService } from "@/lib/services/contracts";

export default function FolderContracts() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [filters, setFilters] = useState<ContractFilters>({});
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!folderId) return;
      try {
        setIsLoading(true);
        const [folderData, contractsData] = await Promise.all([
          foldersService.get(folderId),
          foldersService.contracts(folderId),
        ]);

        if (folderData) {
          setFolder({
            ...folderData,
            createdAt: new Date(folderData.createdAt),
            updatedAt: new Date(folderData.updatedAt),
          } as Folder);
        }

        const parsedContracts = Array.isArray(contractsData)
          ? contractsData.map((c) => ({
              ...c,
              startDate: new Date(c.startDate),
              endDate: new Date(c.endDate),
              createdAt: new Date(c.createdAt),
              updatedAt: new Date(c.updatedAt),
            }))
          : [];

        setContracts(parsedContracts);
        setFilteredContracts(parsedContracts);
      } catch (error: any) {
        toast.error(error?.message || "Erro ao carregar dados da pasta");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [folderId]);

  useEffect(() => {
    const filtered = filterContracts(contracts, filters);
    setFilteredContracts(filtered);
  }, [contracts, filters]);

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
    return icons[iconName] || FolderOpen;
  };

  const getTotalValue = () => {
    return filteredContracts.reduce((sum, contract) => sum + contract.value, 0);
  };

  const getStatusCounts = () => {
    return {
      active: filteredContracts.filter((c) => c.status === "active").length,
      expiring: filteredContracts.filter((c) => c.status === "expiring_soon")
        .length,
      expired: filteredContracts.filter((c) => c.status === "expired").length,
    };
  };

  // Get unique values for filters
  const companies = [...new Set(contracts.map((c) => c.contractingCompany))];
  const responsibles = [
    ...new Set(contracts.map((c) => c.internalResponsible)),
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Carregando contratos da pasta...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!folder) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pasta não encontrada</h2>
            <p className="text-muted-foreground mb-4">
              A pasta solicitada não existe ou foi removida.
            </p>
            <Button onClick={() => navigate("/folders")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar às Pastas
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const IconComponent = getIconComponent(folder.icon);
  const statusCounts = getStatusCounts();

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/folders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar às Pastas
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: folder.color }}
            >
              <IconComponent className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {folder.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-600">
                  {folder.description || "Sem descrição"}
                </p>
                <Badge
                  variant={folder.type === "system" ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {folder.type === "system" ? "Sistema" : "Personalizada"}
                </Badge>
              </div>
            </div>
          </div>

          {hasPermission("canCreateContracts") && (
            <Button onClick={() => navigate("/contracts/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Contratos
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredContracts.length}
              </div>
              <p className="text-xs text-muted-foreground">nesta pasta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Contratos Ativos
              </CardTitle>
              <div className="h-4 w-4 bg-green-600 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statusCounts.active}
              </div>
              <p className="text-xs text-muted-foreground">ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vencendo em Breve
              </CardTitle>
              <div className="h-4 w-4 bg-yellow-600 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {statusCounts.expiring}
              </div>
              <p className="text-xs text-muted-foreground">
                próximos ao vencimento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <div className="h-4 w-4 bg-blue-600 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(getTotalValue())}
              </div>
              <p className="text-xs text-muted-foreground">
                valor dos contratos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1">
            <FiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              companies={companies}
              responsibles={responsibles}
            />
          </div>

          {/* Contracts */}
          <div className="lg:col-span-3">
            {contracts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white mb-4"
                    style={{ backgroundColor: folder.color }}
                  >
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Pasta vazia</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    Esta pasta ainda não possui contratos. Comece criando um
                    novo contrato.
                  </p>
                  {hasPermission("canCreateContracts") && (
                    <Button onClick={() => navigate("/contracts/new")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Contrato
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : filteredContracts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhum contrato encontrado
                  </h3>
                  <p className="text-muted-foreground text-center">
                    Ajuste os filtros para encontrar os contratos desejados.
                  </p>
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <ContractTable contracts={filteredContracts} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContracts.map((contract) => (
                  <ContractCard key={contract.id} contract={contract} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Folder Info */}
        {folder.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sobre esta Pasta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{folder.description}</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span>
                  Criada em{" "}
                  {new Date(folder.createdAt).toLocaleDateString("pt-BR")}
                </span>
                <span>
                  Última atualização:{" "}
                  {new Date(folder.updatedAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
