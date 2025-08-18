import { useState } from "react";
import { Contract } from "@/types/contract";
import { formatDate, formatCurrency } from "@/lib/contracts";
import { ContractStatus } from "./ContractStatus";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Eye,
  Edit,
  FileText,
  Mail,
  ArrowUpDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ContractTableProps {
  contracts: Contract[];
  onEdit?: (contract: Contract) => void;
  onNotify?: (contract: Contract) => void;
}

type SortField =
  | "name"
  | "endDate"
  | "value"
  | "status"
  | "contractingCompany"
  | "internalResponsible";
type SortDirection = "asc" | "desc";

export function ContractTable({
  contracts,
  onEdit,
  onNotify,
}: ContractTableProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>("endDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedContracts = [...contracts].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle dates
    if (sortField === "endDate") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    // Handle strings
    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    // Handle status ordering
    if (sortField === "status") {
      const statusOrder = { expired: 0, expiring_soon: 1, active: 2 };
      aValue = statusOrder[a.status];
      bValue = statusOrder[b.status];
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleViewContract = (contract: Contract) => {
    navigate(`/contracts/${contract.id}`);
  };

  const handleEditContract = (contract: Contract) => {
    if (onEdit) {
      onEdit(contract);
    } else {
      toast.info("Funcionalidade de edição em desenvolvimento");
    }
  };

  const handleNotifyResponsible = (contract: Contract) => {
    if (onNotify) {
      onNotify(contract);
    } else {
      toast.success(`Notificação enviada para ${contract.internalResponsible}`);
    }
  };

  const handleDownloadContract = (contract: Contract) => {
    if (contract.filePath) {
      // In a real app, this would download the actual file
      toast.info(`Download de ${contract.fileName} iniciado`);
    } else {
      toast.error("Arquivo não disponível");
    }
  };

  const SortableHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 font-medium text-left justify-start hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">
              <SortableHeader field="name">Nome do Contrato</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="contractingCompany">
                Empresa
              </SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="internalResponsible">
                Responsável
              </SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="endDate">Vencimento</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="value">Valor</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="status">Status</SortableHeader>
            </TableHead>
            <TableHead className="text-center">Arquivo</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedContracts.map((contract) => (
            <TableRow
              key={contract.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleViewContract(contract)}
            >
              <TableCell className="font-medium">
                <div>
                  <p className="font-medium truncate">{contract.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {contract.contractedParty}
                  </p>
                </div>
              </TableCell>
              <TableCell>{contract.contractingCompany}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{contract.internalResponsible}</p>
                  <p className="text-xs text-muted-foreground">
                    {contract.responsibleEmail}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div
                  className={`font-medium ${
                    contract.status === "expired"
                      ? "text-red-600"
                      : contract.status === "expiring_soon"
                        ? "text-yellow-600"
                        : "text-gray-900"
                  }`}
                >
                  {formatDate(contract.endDate)}
                </div>
              </TableCell>
              <TableCell className="font-medium text-green-600">
                {formatCurrency(contract.value)}
              </TableCell>
              <TableCell>
                <ContractStatus status={contract.status} />
              </TableCell>
              <TableCell className="text-center">
                {contract.fileName && (
                  <Badge variant="outline" className="text-xs">
                    {contract.fileType?.toUpperCase()}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewContract(contract);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditContract(contract);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotifyResponsible(contract);
                      }}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Notificar Responsável
                    </DropdownMenuItem>
                    {contract.fileName && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadContract(contract);
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Baixar Arquivo
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {sortedContracts.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileText className="h-8 w-8" />
                  <p>Nenhum contrato encontrado</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
