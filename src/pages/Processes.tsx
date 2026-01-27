import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Gavel } from "lucide-react";
import { processesService } from "@/lib/services/processes";
import { foldersService } from "@/lib/services/folders";
import { usersService } from "@/lib/services/users";
import { Folder } from "@/types/folder";
import { Process, ProcessContingency, ProcessStatus } from "@/types/process";
import { User } from "@/types/auth";
import { toast } from "@/components/ui/use-toast";

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

const actionGroups = ["Administrativo", "Civel", "Trabalhista", "Tributario", "Regulatorio", "Marketing", "Outro"];
const phases = ["Negociacao", "Investigacao", "Instrucao", "Audiencia", "Recursos", "Execucao", "Marketing", "Outro"];

const Processes = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProcessStatus | "todas">("todas");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "ativo" as ProcessStatus,
    folderId: "",
    involvedParties: "",
    responsibleId: "",
    notes: "",
    actionGroup: "",
    phase: "",
    cnjNumber: "",
    protocolNumber: "",
    originProcess: "",
    requestDate: "",
    claimValue: "",
    feesValue: "",
    feesPercentage: "",
    contingency: "",
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [procRes, folderRes, usersRes] = await Promise.all([
          processesService.list(),
          foldersService.list(),
          usersService.list(),
        ]);
        if (!mounted) return;
        setProcesses(procRes || []);
        setFolders(folderRes || []);
        setUsers(usersRes || []);
      } catch (err: any) {
        if (mounted) toast({ variant: "destructive", title: err?.message || "Erro ao carregar processos" });
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return processes.filter((p) => {
      const matchesStatus = status === "todas" || p.status === status;
      const matchesQuery = !q || p.title.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [processes, search, status]);

  const parseNumber = (value: string) => {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast({ variant: "destructive", title: "Informe o titulo do processo" });
      return;
    }
    setSaving(true);
    try {
      const created = await processesService.create({
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        folderId: form.folderId || null,
        involvedParties: form.involvedParties,
        responsibleId: form.responsibleId || null,
        notes: form.notes.trim() || null,
        actionGroup: form.actionGroup || null,
        phase: form.phase || null,
        cnjNumber: form.cnjNumber.trim() || null,
        protocolNumber: form.protocolNumber.trim() || null,
        originProcess: form.originProcess.trim() || null,
        requestDate: form.requestDate || null,
        claimValue: parseNumber(form.claimValue),
        feesValue: parseNumber(form.feesValue),
        feesPercentage: parseNumber(form.feesPercentage),
        contingency: (form.contingency as ProcessContingency) || null,
      });
      setProcesses((prev) => [created, ...prev]);
      setForm({
        title: "",
        description: "",
        status: "ativo",
        folderId: "",
        involvedParties: "",
        responsibleId: "",
        notes: "",
        actionGroup: "",
        phase: "",
        cnjNumber: "",
        protocolNumber: "",
        originProcess: "",
        requestDate: "",
        claimValue: "",
        feesValue: "",
        feesPercentage: "",
        contingency: "",
      });
      setOpen(false);
      toast({ title: "Processo criado" });
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.message || "Erro ao criar processo" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Processos</h1>
            <p className="text-sm text-gray-500">Acompanhe processos e relacione a pastas.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-9 w-56"
                placeholder="Pesquisar processos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo processo
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{p.title}</CardTitle>
                  <Badge className={statusClasses[p.status]}>{statusLabels[p.status]}</Badge>
                </div>
                <CardDescription>{p.description || "Sem descricao"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-gray-500" />
                  {p.folderId
                    ? `Pasta: ${folders.find((f) => f.id === p.folderId)?.name || "Sem nome"}`
                    : "Sem pasta"}
                </div>
                {p.cnjNumber && <div>CNJ: {p.cnjNumber}</div>}
                {p.responsibleId && (
                  <div>
                    Responsavel: {users.find((u) => u.id === p.responsibleId)?.name || "Sem nome"}
                  </div>
                )}
                {p.contingency && <div>Contingenciamento: {contingencyLabels[p.contingency]}</div>}
              </CardContent>
            </Card>
          ))}
          {!filtered.length && (
            <div className="col-span-full flex items-center justify-center rounded-lg border border-dashed p-8 text-sm text-gray-500">
              Nenhum processo encontrado.
            </div>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo processo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-2">
                <Label>Titulo</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Descricao</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Partes envolvidas</Label>
                <Input
                  placeholder="Ex: Empresa X, Joao Silva"
                  value={form.involvedParties}
                  onChange={(e) => setForm((f) => ({ ...f, involvedParties: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Responsavel</Label>
                <Select
                  value={form.responsibleId || "__none__"}
                  onValueChange={(v) => setForm((f) => ({ ...f, responsibleId: v === "__none__" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um responsavel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Anotacoes gerais</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Grupo de acao</Label>
                  <Select
                    value={form.actionGroup || "__none__"}
                    onValueChange={(v) => setForm((f) => ({ ...f, actionGroup: v === "__none__" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nao definido</SelectItem>
                      {actionGroups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fase</Label>
                  <Select
                    value={form.phase || "__none__"}
                    onValueChange={(v) => setForm((f) => ({ ...f, phase: v === "__none__" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nao definida</SelectItem>
                      {phases.map((phase) => (
                        <SelectItem key={phase} value={phase}>
                          {phase}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Numero do processo CNJ</Label>
                  <Input value={form.cnjNumber} onChange={(e) => setForm((f) => ({ ...f, cnjNumber: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Numero do protocolo/requerimento</Label>
                  <Input
                    value={form.protocolNumber}
                    onChange={(e) => setForm((f) => ({ ...f, protocolNumber: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Processo originario</Label>
                  <Input
                    value={form.originProcess}
                    onChange={(e) => setForm((f) => ({ ...f, originProcess: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data do requerimento</Label>
                  <Input
                    type="date"
                    value={form.requestDate}
                    onChange={(e) => setForm((f) => ({ ...f, requestDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ProcessStatus }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Valor da causa</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.claimValue}
                    onChange={(e) => setForm((f) => ({ ...f, claimValue: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor dos honorarios</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.feesValue}
                    onChange={(e) => setForm((f) => ({ ...f, feesValue: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Percentual de honorarios (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.feesPercentage}
                    onChange={(e) => setForm((f) => ({ ...f, feesPercentage: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contingenciamento</Label>
                <Select
                  value={form.contingency || "__none__"}
                  onValueChange={(v) => setForm((f) => ({ ...f, contingency: v === "__none__" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nao definido</SelectItem>
                    <SelectItem value="alta">Provavel (chance alta)</SelectItem>
                    <SelectItem value="possivel">Possivel (talvez)</SelectItem>
                    <SelectItem value="remota">Remota (dificil)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pasta</Label>
                <Select value={form.folderId || "__none__"} onValueChange={(v) => setForm((f) => ({ ...f, folderId: v === "__none__" ? "" : v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma pasta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhuma</SelectItem>
                    {folders.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Salvando..." : "Criar processo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Processes;
