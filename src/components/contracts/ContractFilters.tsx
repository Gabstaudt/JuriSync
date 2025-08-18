import { useState } from "react";
import { ContractFilters as Filters, ContractStatus } from "@/types/contract";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ContractFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  companies: string[];
  responsibles: string[];
}

export function ContractFilters({
  filters,
  onFiltersChange,
  companies,
  responsibles,
}: ContractFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof Filters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== "" && value !== null,
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
          <div className="flex items-center gap-1">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground h-7 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 px-2"
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Quick filters row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="space-y-1">
            <Label htmlFor="search" className="text-xs">
              Buscar
            </Label>
            <Input
              id="search"
              placeholder="Nome, empresa..."
              value={filters.search || ""}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label htmlFor="status" className="text-xs">
              Status
            </Label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                updateFilter("status", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="expiring_soon">Vencendo</SelectItem>
                <SelectItem value="expired">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Responsible */}
          <div className="space-y-1">
            <Label htmlFor="responsible" className="text-xs">
              Responsável
            </Label>
            <Select
              value={filters.responsible || "all"}
              onValueChange={(value) =>
                updateFilter("responsible", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {responsibles.slice(0, 5).map((responsible) => (
                  <SelectItem key={responsible} value={responsible}>
                    {responsible}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t pt-3 space-y-3">
            {/* Company */}
            <div className="space-y-1">
              <Label htmlFor="company" className="text-xs">
                Empresa Contratante
              </Label>
              <Select
                value={filters.contractingCompany || "all"}
                onValueChange={(value) =>
                  updateFilter(
                    "contractingCompany",
                    value === "all" ? undefined : value,
                  )
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Data Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-8 text-sm",
                        !filters.startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {filters.startDate
                        ? format(filters.startDate, "dd/MM")
                        : "Início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => updateFilter("startDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Data Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-8 text-sm",
                        !filters.endDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {filters.endDate
                        ? format(filters.endDate, "dd/MM")
                        : "Fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => updateFilter("endDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
