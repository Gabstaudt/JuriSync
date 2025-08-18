import { Contract } from "@/types/contract";
import { formatDate, formatCurrency } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContractStatus } from "./ContractStatus";
import {
  CalendarDays,
  Building2,
  User,
  DollarSign,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ContractCardProps {
  contract: Contract;
  onEdit?: (contract: Contract) => void;
}

export function ContractCard({ contract, onEdit }: ContractCardProps) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/contracts/${contract.id}`);
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex-1 mr-2 overflow-hidden">
            {contract.name}
          </CardTitle>
          <ContractStatus status={contract.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Contratante:</span>
            <span className="font-medium truncate">
              {contract.contractingCompany}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Responsável:</span>
            <span className="font-medium truncate">
              {contract.internalResponsible}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Vencimento:</span>
            <span
              className={`font-medium ${
                contract.status === "expired"
                  ? "text-red-600"
                  : contract.status === "expiring_soon"
                    ? "text-yellow-600"
                    : "text-gray-900"
              }`}
            >
              {formatDate(contract.endDate)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Valor:</span>
            <span className="font-medium text-green-600">
              {formatCurrency(contract.value)}
            </span>
          </div>

          {contract.fileName && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Arquivo:</span>
              <Badge variant="outline" className="text-xs">
                {contract.fileType?.toUpperCase()}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetails}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Ver Detalhes
          </Button>

          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(contract)}>
              Editar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
