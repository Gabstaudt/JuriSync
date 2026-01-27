import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  Edit,
  ListChecks,
  Plus,
  Search,
  Trash2,
  ChevronsUpDown,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { tasksService } from "@/lib/services/tasks";
import { foldersService } from "@/lib/services/folders";
import { contractsService } from "@/lib/services/contracts";
import { usersService } from "@/lib/services/users";
import { teamsService } from "@/lib/services/teams";
import { Folder } from "@/types/folder";
import { Contract } from "@/types/contract";
import { User } from "@/types/auth";
import { Task, TaskPriority, TaskStatus } from "@/types/task";
import { Team } from "@/types/team";
import { useAuth } from "@/contexts/AuthContext";
import { TaskFiltersModal } from "@/components/tasks/TaskFiltersModal";

type FormState = {
  id?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  tags: string;
  folderId: string;
  contractId: string;
  responsibleId: string;
  assignees: string[];
};

const statusLabels: Record<TaskStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluida",
};

const priorityLabels: Record<TaskPriority, string> = {
  baixa: "Baixa",
  media: "Media",
  alta: "Alta",
};

const priorityColors: Record<TaskPriority, string> = {
  baixa: "bg-emerald-100 text-emerald-800",
  media: "bg-amber-100 text-amber-800",
  alta: "bg-rose-100 text-rose-800",
};

const defaultForm: FormState = {
  title: "",
  description: "",
  status: "pendente",
  priority: "media",
  dueDate: "",
  tags: "",
  folderId: "",
  contractId: "",
  responsibleId: "",
  assignees: [],
};

const MultiUserSelector = ({
  label,
  selectedIds,
  users,
  onChange,
}: {
  label: string;
  selectedIds: string[];
  users: User[];
  onChange: (ids: string[]) => void;
}) => {
  const toggle = (id: string) => {
    const set = new Set(selectedIds);
    set.has(id) ? set.delete(id) : set.add(id);
    onChange(Array.from(set));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span>{selectedIds.length ? `${selectedIds.length} selecionado(s)` : "Selecionar usuarios"}</span>
            <ChevronsUpDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-80">
          <Command>
            <CommandInput placeholder="Buscar usuario..." />
            <CommandList>
              <CommandEmpty>Nenhum usuario encontrado</CommandEmpty>
              <CommandGroup>
                {users.map((u) => (
                  <CommandItem key={u.id} onSelect={() => toggle(u.id)} className="flex items-start gap-2">
                    <Checkbox checked={selectedIds.includes(u.id)} className="mt-0.5" onCheckedChange={() => toggle(u.id)} />
                    <div>
                      <div className="text-sm font-medium">{u.name || u.email}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="flex flex-wrap gap-2">
        {selectedIds.map((id) => {
          const user = users.find((u) => u.id === id);
          return (
            <Badge key={id} variant="secondary">
              {user?.name || user?.email || id}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("__all__");
  const [selectedUser, setSelectedUser] = useState<string>("__all__");
  const [selectedFolder, setSelectedFolder] = useState<string>("__all__");
  const [selectedContract, setSelectedContract] = useState<string>("__all__");
  const [onlyMine, setOnlyMine] = useState<boolean>(false);
  const [assignTeam, setAssignTeam] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [activeStatus, setActiveStatus] = useState<TaskStatus | "todas" | "vencidas">("todas");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const tasksRes = await tasksService.list();
        if (!mounted) return;
        setTasks(tasksRes || []);

        // Carrega dados auxiliares sem travar a renderizacao inicial
        Promise.all([foldersService.list(), contractsService.list(), usersService.list(), teamsService.list()])
          .then(([foldersRes, contractsRes, usersRes, teamsRes]) => {
            if (!mounted) return;
            setFolders(foldersRes || []);
            setContracts(contractsRes || []);
            setUsers(usersRes || []);
            setTeams(teamsRes || []);
          })
          .catch((err: any) => {
            if (mounted) {
              toast({ variant: "destructive", title: err?.message || "Erro ao carregar dados auxiliares" });
            }
          });
      } catch (err: any) {
        if (mounted) {
          toast({ variant: "destructive", title: err?.message || "Erro ao carregar dados" });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      const now = new Date();
      const due = task.dueDate ? new Date(task.dueDate) : null;
      const isOverdue = due ? due < now && task.status !== "concluida" : false;
      const matchesStatus =
        activeStatus === "todas"
          ? true
          : activeStatus === "vencidas"
            ? isOverdue
            : task.status === activeStatus;
      const query = search.trim().toLowerCase();
      const matchesQuery =
        !query ||
        task.title.toLowerCase().includes(query) ||
        (task.description || "").toLowerCase().includes(query) ||
        (task.assignees || []).some((a) => `${a.name || ""} ${a.email || ""}`.toLowerCase().includes(query));
      const matchesMine =
        !onlyMine || (user && (task.assignees || []).some((a) => a.id === user.id || a.email === user.email));
      const selected = selectedTeam === "__all__" ? "" : selectedTeam;
      const teamMembers = teams.find((t) => t.id === selected)?.members;
      const matchesTeam =
        !selected || !teamMembers
          ? true
          : teamMembers.some((m) => (task.assignees || []).some((a) => a.id === m.id));
      const matchesUser =
        selectedUser === "__all__" ||
        (task.assignees || []).some((a) => a.id === selectedUser || a.email === selectedUser);
      const matchesFolder = selectedFolder === "__all__" || task.folderId === selectedFolder;
      const matchesContract = selectedContract === "__all__" || task.contractId === selectedContract;

      return matchesStatus && matchesQuery && matchesMine && matchesTeam && matchesUser && matchesFolder && matchesContract;
    });
  }, [tasks, activeStatus, search, onlyMine, selectedTeam, selectedUser, selectedFolder, selectedContract, teams, user]);

  const kanbanColumns = useMemo(() => {
    const byStatus: Record<TaskStatus, Task[]> = { pendente: [], em_andamento: [], concluida: [] };
    const query = search.trim().toLowerCase();
    tasks.forEach((task) => {
      const matchesQuery =
        !query ||
        task.title.toLowerCase().includes(query) ||
        (task.description || "").toLowerCase().includes(query) ||
        (task.assignees || []).some((a) => `${a.name || ""} ${a.email || ""}`.toLowerCase().includes(query));
      const matchesMine =
        !onlyMine || (user && (task.assignees || []).some((a) => a.id === user.id || a.email === user.email));
      const selected = selectedTeam === "__all__" ? "" : selectedTeam;
      const teamMembers = teams.find((t) => t.id === selected)?.members;
      const matchesTeam =
        !selected || !teamMembers
          ? true
          : teamMembers.some((m) => (task.assignees || []).some((a) => a.id === m.id));
      const matchesUser =
        selectedUser === "__all__" ||
        (task.assignees || []).some((a) => a.id === selectedUser || a.email === selectedUser);
      const matchesFolder = selectedFolder === "__all__" || task.folderId === selectedFolder;
      const matchesContract = selectedContract === "__all__" || task.contractId === selectedContract;
      if (matchesQuery && matchesMine && matchesTeam && matchesUser && matchesFolder && matchesContract) {
        byStatus[task.status].push(task);
      }
    });
    return byStatus;
  }, [tasks, search, onlyMine, selectedTeam, selectedUser, selectedFolder, selectedContract, teams, user]);

  const startCreating = () => {
    setEditingId(null);
    setForm(defaultForm);
    setAssignTeam("");
    setIsDialogOpen(true);
  };

  const startEditing = (task: Task) => {
    const primaryAssignee = task.assignees?.[0]?.id || "";
    setEditingId(task.id);
    setAssignTeam("");
    setForm({
      id: task.id,
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : "",
      tags: (task.tags || []).join(", "),
      folderId: task.folderId || "",
      contractId: task.contractId || "",
      responsibleId: primaryAssignee,
      assignees: (task.assignees || []).map((a) => a.id),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast({ variant: "destructive", title: "Informe um titulo para a tarefa" });
      return;
    }

    const uniqueAssignees = Array.from(new Set([form.responsibleId, ...form.assignees].filter(Boolean)));

    const payload = {
      title: form.title,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      folderId: form.folderId || null,
      contractId: form.contractId || null,
      assignees: uniqueAssignees.map((id) => ({ id })),
    };

    try {
      setSaving(true);
      if (editingId) {
        const updated = await tasksService.update(editingId, payload);
        setTasks((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
        toast({ title: "Tarefa atualizada" });
      } else {
        const created = await tasksService.create(payload);
        setTasks((prev) => [created, ...prev]);
        toast({ title: "Tarefa criada" });
      }
      setIsDialogOpen(false);
      setEditingId(null);
      setForm(defaultForm);
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.message || "Erro ao salvar tarefa" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tasksService.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Tarefa removida" });
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.message || "Erro ao excluir tarefa" });
    }
  };

  const handleStatusToggle = async (task: Task) => {
    const nextStatus = task.status === "concluida" ? "em_andamento" : "concluida";
    try {
      const updated = await tasksService.update(task.id, { status: nextStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.message || "Erro ao atualizar status" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tarefas</h1>
            <p className="text-sm text-gray-500">Organize e acompanhe o andamento das tarefas.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-9 w-64"
                placeholder="Pesquisar tarefas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)} className="gap-2">
              Filtros
            </Button>
            <div className="flex items-center gap-1 rounded-md border bg-white p-1">
              <Button
                size="sm"
                variant={viewMode === "list" ? "secondary" : "ghost"}
                className="gap-1"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
                Lista
              </Button>
              <Button
                size="sm"
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                className="gap-1"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </Button>
            </div>
            <Button onClick={startCreating} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova tarefa
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">Carregando...</div>
        ) : viewMode === "list" ? (
          <Tabs defaultValue="todas" value={activeStatus} onValueChange={(v) => setActiveStatus(v as any)}>
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="pendente">Pendentes</TabsTrigger>
              <TabsTrigger value="em_andamento">Em andamento</TabsTrigger>
              <TabsTrigger value="concluida">Concluidas</TabsTrigger>
              <TabsTrigger value="vencidas">Vencidas</TabsTrigger>
            </TabsList>
            <TabsContent value={activeStatus}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((task) => (
                  <Card key={task.id} className="relative flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <CardDescription className="mt-1 text-sm text-gray-600">
                            {task.description || "Sem descricao"}
                          </CardDescription>
                        </div>
                        <Badge className={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {(() => {
                          const now = new Date();
                          const due = task.dueDate ? new Date(task.dueDate) : null;
                          const diffDays =
                            due != null ? Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                          const isOverdue = due ? due < now && task.status !== "concluida" : false;
                          const isUrgent = due ? diffDays !== null && diffDays >= 0 && diffDays <= 3 && task.status !== "concluida" : false;
                          return (
                            <>
                              {isUrgent && !isOverdue && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Urgente
                                </Badge>
                              )}
                              {isOverdue && (
                                <Badge variant="destructive" className="flex items-center gap-1 bg-rose-600 text-white">
                                  <Clock className="h-3 w-3" />
                                  Vencida
                                </Badge>
                              )}
                            </>
                          );
                        })()}
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
                          <Clock className="h-3 w-3" />
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString("pt-BR") : "Sem prazo"}
                        </span>
                        {task.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <ListChecks className="h-4 w-4 text-gray-500" />
                          {statusLabels[task.status]}
                        </span>
                        {task.assignees?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {task.assignees.map((a) => (
                              <Badge key={a.id} variant="outline">
                                {a.name || a.email || a.id}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem responsaveis</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusToggle(task)}
                          className="gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {task.status === "concluida" ? "Reabrir" : "Concluir"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEditing(task)} className="gap-1">
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(task.id)} className="gap-1">
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {!filtered.length && (
                  <div className="col-span-full flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-gray-500">
                    Nenhuma tarefa encontrada.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {(["pendente", "em_andamento", "concluida"] as TaskStatus[]).map((status) => (
              <div key={status} className="rounded-lg border bg-white">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">{statusLabels[status]}</span>
                  <Badge variant="outline">{kanbanColumns[status].length}</Badge>
                </div>
                <div className="p-3 space-y-3 min-h-[200px]">
                  {kanbanColumns[status].map((task) => (
                    <Card key={task.id} className="flex flex-col border-gray-200 shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{task.title}</CardTitle>
                          <Badge className={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Badge>
                        </div>
                        <CardDescription className="text-sm text-gray-600">
                          {task.description || "Sem descricao"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          {(() => {
                            const now = new Date();
                            const due = task.dueDate ? new Date(task.dueDate) : null;
                            const diffDays =
                              due != null
                                ? Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                                : null;
                            const isOverdue = due ? due < now && task.status !== "concluida" : false;
                            const isUrgent =
                              due ? diffDays !== null && diffDays >= 0 && diffDays <= 3 && task.status !== "concluida" : false;
                            return (
                              <>
                                {isUrgent && !isOverdue && (
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Urgente
                                  </Badge>
                                )}
                                {isOverdue && (
                                  <Badge variant="destructive" className="flex items-center gap-1 bg-rose-600 text-white">
                                    <Clock className="h-3 w-3" />
                                    Vencida
                                  </Badge>
                                )}
                              </>
                            );
                          })()}
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
                            <Clock className="h-3 w-3" />
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString("pt-BR") : "Sem prazo"}
                          </span>
                          {task.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        {task.assignees?.length ? (
                          <div className="flex flex-wrap gap-1 text-xs">
                            {task.assignees.map((a) => (
                              <Badge key={a.id} variant="outline">
                                {a.name || a.email || a.id}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Sem responsaveis</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusToggle(task)}
                            className="gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            {task.status === "concluida" ? "Reabrir" : "Concluir"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => startEditing(task)} className="gap-1">
                            <Edit className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(task.id)}
                            className="gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!kanbanColumns[status].length && (
                    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
                      Nenhuma tarefa
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <TaskFiltersModal
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          teams={teams}
          users={users}
          folders={folders}
          contracts={contracts.map((c) => ({ id: c.id, name: c.name }))}
          value={{
            teamId: selectedTeam,
            responsibleId: selectedUser,
            folderId: selectedFolder,
            contractId: selectedContract,
            onlyMine,
          }}
          onApply={(f) => {
            setSelectedTeam(f.teamId);
            setSelectedUser(f.responsibleId);
            setSelectedFolder(f.folderId);
            setSelectedContract(f.contractId);
            setOnlyMine(f.onlyMine);
          }}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
              <DialogDescription>Defina titulo, responsaveis, prioridade, prazo e vinculos com pasta ou contrato.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="titulo">Titulo</Label>
                <Input
                  id="titulo"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Revisar contrato"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as TaskStatus }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                    <SelectItem value="concluida">Concluida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as TaskPriority }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prazo">Prazo</Label>
                <Input id="prazo" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descricao">Descricao</Label>
                <Input
                  id="descricao"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Detalhes adicionais"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="folder">Vincular a pasta (opcional)</Label>
                <Select value={form.folderId || ""} onValueChange={(v) => setForm((f) => ({ ...f, folderId: v === "none" ? "" : v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma pasta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma pasta</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract">Vincular a contrato (opcional)</Label>
                <Select value={form.contractId || ""} onValueChange={(v) => setForm((f) => ({ ...f, contractId: v === "none" ? "" : v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum contrato</SelectItem>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsavel</Label>
                <Select value={form.responsibleId} onValueChange={(v) => setForm((f) => ({ ...f, responsibleId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsavel" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">Atribuir a time (opcional)</Label>
                <Select
                  value={assignTeam}
                  onValueChange={(v) => {
                    setAssignTeam(v);
                    const members = teams.find((t) => t.id === v)?.members || [];
                    if (members.length) {
                      const ids = Array.from(new Set([form.responsibleId, ...form.assignees, ...members.map((m) => m.id)].filter(Boolean)));
                      setForm((f) => ({ ...f, assignees: ids }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum time</SelectItem>
                    {teams
                      .filter((team) => Boolean(team.id))
                      .map((team) => (
                        <SelectItem key={team.id} value={team.id as string}>
                          {team.name || "Time sem nome"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tags">Tags (separe por virgula)</Label>
                <Input
                  id="tags"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="prioridade, cliente, revisao"
                />
              </div>
              <div className="md:col-span-2">
                <MultiUserSelector
                  label="Responsaveis adicionais (opcional)"
                  selectedIds={form.assignees}
                  users={users}
                  onChange={(ids) => setForm((f) => ({ ...f, assignees: ids }))}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Salvando..." : editingId ? "Atualizar" : "Criar tarefa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Tasks;
