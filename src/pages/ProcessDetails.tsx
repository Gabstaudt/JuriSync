import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Process, ProcessStatus, ProcessContingency } from "@/types/process";
import { Contract } from "@/types/contract";
import { foldersService } from "@/lib/services/folders";
import { usersService } from "@/lib/services/users";
import { processesService } from "@/lib/services/processes";
import { contractsService } from "@/lib/services/contracts";
import { formatCurrency, formatDate } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Gavel,
  Calendar,
  User,
  FileText,
  Link2,
  FolderOpen,
  Scale,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

const statusLabels: Record<ProcessStatus, string> = {
  ativo: "Ativo",
  em_andamento: "Em andamento",
  encerrado: "Encerrado",
};

const statusClasses: Record<ProcessStatus, string> = {
  ativo: "bg-emerald-100 text-emerald-800",
  em_andamento: "bg-amber-100 text-amber-800",
  encerrado: "bg-gray-200 text-gray-700",
};

const contingencyLabels: Record<ProcessContingency, string> = {
  alta: "Provavel (chance alta)",
  possivel: "Possivel (talvez)",
  remota: "Remota (dificil)",
};

export default function ProcessDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [process, setProcess] = useState<Process | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [folders, setFolders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [linkedContracts, setLinkedContracts] = useState<Contract[]>([]);
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const [linkOpen, setLinkOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState("");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      try {
        const [proc, links, folderRes, usersRes, contractsRes] = await Promise.all([
          processesService.get(id),
          processesService.contracts.list(id),
          foldersService.list(),
          usersService.list(),
          contractsService.list(),
        ]);
        if (!mounted) return;
        setProcess({
          ...proc,
          createdAt: proc.createdAt ? new Date(proc.createdAt as any) : undefined,
          updatedAt: proc.updatedAt ? new Date(proc.updatedAt as any) : undefined,
        });
        const parsedLinks = Array.isArray(links)
          ? links.map((c: any) => ({
              ...c,
              startDate: c.startDate ? new Date(c.startDate) : undefined,
              endDate: c.endDate ? new Date(c.endDate) : undefined,
              createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
              updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
            }))
          : [];
        setLinkedContracts(parsedLinks);
        setFolders(folderRes || []);
        setUsers(usersRes || []);
        setAllContracts(
          (contractsRes || []).map((c: any) => ({
            ...c,
            startDate: c.startDate ? new Date(c.startDate) : undefined,
            endDate: c.endDate ? new Date(c.endDate) : undefined,
            createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
            updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
          })),
        );
      } catch (err: any) {
        if (mounted) toast.error(err?.message || "Processo nao encontrado");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const availableContracts = useMemo(() => {
    const linked = new Set(linkedContracts.map((c) => c.id));
    return allContracts.filter((c) => !linked.has(c.id));
  }, [allContracts, linkedContracts]);

  const handleLinkContract = async () => {
    if (!id || !selectedContractId) return;
    setLinking(true);
    try {
      await processesService.contracts.add(id, selectedContractId);
      const linked = allContracts.find((c) => c.id === selectedContractId);
      if (linked) setLinkedContracts((prev) => [linked, ...prev]);
      setSelectedContractId("");
      setLinkOpen(false);
      toast.success("Contrato vinculado");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao vincular contrato");
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkContract = async (contractId: string) => {
    if (!id) return;
    try {
      await processesService.contracts.remove(id, contractId);
      setLinkedContracts((prev) => prev.filter((c) => c.id !== contractId));
      toast.success("Vinculo removido");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao remover vinculo");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando processo...</p>
        </div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Gavel className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Processo nao encontrado</h2>
          <p className="text-muted-foreground mb-4">
            O processo solicitado nao existe ou foi removido.
          </p>
          <Button onClick={() => navigate("/processes")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Processos
          </Button>
        </div>
      </div>
    );
  }

  const folderName = process.folderId
    ? folders.find((f: any) => f.id === process.folderId)?.name || "Sem nome"
    : "Sem pasta";
  const responsibleName = process.responsibleId
    ? users.find((u: any) => u.id === process.responsibleId)?.name || "Sem nome"
    : "Nao definido";

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/processes")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 truncate">
                  {process.title}
                </h1>
                <p className="text-sm text-muted-foreground">ID: {process.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={statusClasses[process.status]}>
                {statusLabels[process.status]}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setLinkOpen(true)}>
                <Link2 className="h-4 w-4 mr-1" />
                Vincular contrato
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
                  Informacoes do Processo
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pasta</p>
                      <p className="font-medium">{folderName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Responsavel</p>
                      <p className="font-medium">{responsibleName}</p>
                    </div>
                  </div>
                  {process.actionGroup && (
                    <div className="flex items-center gap-3">
                      <Scale className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Grupo de acao</p>
                        <p className="font-medium">{process.actionGroup}</p>
                      </div>
                    </div>
                  )}
                  {process.phase && (
                    <div className="flex items-center gap-3">
                      <Gavel className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Fase</p>
                        <p className="font-medium">{process.phase}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {process.cnjNumber && (
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">CNJ</p>
                        <p className="font-medium">{process.cnjNumber}</p>
                      </div>
                    </div>
                  )}
                  {process.protocolNumber && (
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Protocolo</p>
                        <p className="font-medium">{process.protocolNumber}</p>
                      </div>
                    </div>
                  )}
                  {process.originProcess && (
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Processo originario</p>
                        <p className="font-medium">{process.originProcess}</p>
                      </div>
                    </div>
                  )}
                  {process.requestDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data do requerimento</p>
                        <p className="font-medium">{formatDate(new Date(process.requestDate))}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Valores
                </CardTitle>
                <CardDescription>Valores associados ao processo.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Valor da causa</p>
                  <p className="font-medium">
                    {process.claimValue ? formatCurrency(Number(process.claimValue)) : "Nao informado"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Honorarios</p>
                  <p className="font-medium">
                    {process.feesValue ? formatCurrency(Number(process.feesValue)) : "Nao informado"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Percentual</p>
                  <p className="font-medium">
                    {process.feesPercentage ? `${process.feesPercentage}%` : "Nao informado"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Partes envolvidas
                </CardTitle>
                <CardDescription>Clientes, partes contrarias e envolvidos.</CardDescription>
              </CardHeader>
              <CardContent>
                {process.involvedParties && process.involvedParties.length ? (
                  <div className="flex flex-wrap gap-2">
                    {process.involvedParties.map((p) => (
                      <Badge key={p} variant="secondary">
                        {p}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma parte informada.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Observacoes
                </CardTitle>
                <CardDescription>Notas internas do processo.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea value={process.notes || ""} readOnly className="min-h-[120px]" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Contratos vinculados
                </CardTitle>
                <CardDescription>Relacionamentos entre processos e contratos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {linkedContracts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum contrato vinculado.</p>
                ) : (
                  linkedContracts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between border rounded-md p-3">
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.contractingCompany} • {c.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/contracts/${c.id}`)}>
                          Ver contrato
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleUnlinkContract(c.id)}
                        >
                          Remover vinculo
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">{statusLabels[process.status]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contingenciamento:</span>
                  <span className="font-medium">
                    {process.contingency ? contingencyLabels[process.contingency] : "Nao definido"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contratos vinculados:</span>
                  <span className="font-medium">{linkedContracts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criado em:</span>
                  <span className="font-medium">
                    {process.createdAt ? formatDate(new Date(process.createdAt as any)) : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atualizado em:</span>
                  <span className="font-medium">
                    {process.updatedAt ? formatDate(new Date(process.updatedAt as any)) : "-"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular contrato</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Contrato</Label>
            <Select value={selectedContractId} onValueChange={setSelectedContractId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um contrato" />
              </SelectTrigger>
              <SelectContent>
                {availableContracts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
                {!availableContracts.length && (
                  <SelectItem value="__none__" disabled>
                    Nenhum contrato disponivel
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLinkOpen(false)} disabled={linking}>
              Cancelar
            </Button>
            <Button onClick={handleLinkContract} disabled={!selectedContractId || linking}>
              {linking ? "Vinculando..." : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
