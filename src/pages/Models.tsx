import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Trash2, PencilLine, Search, Download, Info } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { contractsService } from "@/lib/services/contracts";
import { API_URL } from "@/lib/api";
import { modelsService, TemplateDetail, TemplateModel, TemplateHistory } from "@/lib/services/models";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const formatSize = (bytes: number) => {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${sizes[i]}`;
};

const formatType = (fileName?: string, fileType?: string | null) => {
  const fromName = fileName?.split(".").pop();
  if (fromName) return fromName.toLowerCase();
  if (fileType) {
    const mimeTail = fileType.split("/").pop() || fileType;
    const tailExt = mimeTail.split(".").pop() || mimeTail;
    return tailExt.toLowerCase();
  }
  return "arquivo";
};

export default function Models() {
  const [templates, setTemplates] = useState<TemplateModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<TemplateModel | null>(null);
  const [detail, setDetail] = useState<TemplateModel | null>(null);
  const [detailHistory, setDetailHistory] = useState<TemplateHistory[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const filtered = useMemo(() => templates, [templates]);
  const actionLabels: Record<string, string> = {
    create: "Criado",
    update: "Editado",
    delete: "Excluido",
  };

  const loadTemplates = async (term?: string) => {
    setLoading(true);
    try {
      const data = await modelsService.list(term);
      setTemplates(data);
    } catch (e: any) {
      toast({
        variant: "destructive",
        description: e?.message || "Erro ao carregar modelos",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadTemplates(search);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ variant: "destructive", description: "Informe o nome do modelo" });
      return;
    }
    if (!file) {
      toast({ variant: "destructive", description: "Selecione um arquivo" });
      return;
    }
    setSaving(true);
    try {
      const uploaded = await contractsService.upload(file);
      const created = await modelsService.create({
        name: name.trim(),
        description: description.trim() || null,
        filePath: uploaded.filePath,
        fileName: uploaded.fileName || file.name,
        fileType: uploaded.fileType || file.type,
        fileSize: uploaded.fileSize || file.size,
      });
      setTemplates((prev) => [created, ...prev]);
      setName("");
      setDescription("");
      setFile(null);
      toast({ description: "Modelo salvo com sucesso" });
    } catch (e: any) {
      toast({
        variant: "destructive",
        description: e?.message || "Erro ao salvar modelo",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editing) return;
    if (!editing.name?.trim()) {
      toast({ variant: "destructive", description: "Informe o nome do modelo" });
      return;
    }
    setSaving(true);
    try {
      const updated = await modelsService.update(editing.id, {
        name: editing.name.trim(),
        description: editing.description || null,
      });
      setTemplates((prev) => prev.map((tpl) => (tpl.id === updated.id ? updated : tpl)));
      setEditing(null);
      toast({ description: "Modelo atualizado" });
    } catch (e: any) {
      toast({ variant: "destructive", description: e?.message || "Erro ao atualizar" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await modelsService.remove(id);
      setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
      toast({ description: "Modelo removido" });
    } catch (e: any) {
      toast({ variant: "destructive", description: e?.message || "Erro ao excluir" });
    }
  };

  const loadDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const data = await modelsService.get(id);
      setDetail(data.template);
      setDetailHistory(data.history || []);
    } catch (e: any) {
      toast({ variant: "destructive", description: e?.message || "Erro ao carregar detalhes" });
      setDetail(null);
      setDetailHistory([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Central de modelos</p>
            <h1 className="text-2xl font-semibold text-gray-900">Modelos de Contrato</h1>
          </div>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
            Beta
          </Badge>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Enviar novo modelo</CardTitle>
            <p className="text-sm text-gray-500">
              Aceita PDF, DOC, DOCX ou outros arquivos de referencia para seus contratos.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Nome do modelo</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: NDA - Versao 2025"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Arquivo</label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.odt,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={saving}
                />
              </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm text-gray-700">Descricao (opcional)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Resuma como este modelo deve ser usado."
                rows={3}
                disabled={saving}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Salvando..." : "Salvar modelo"}
              </Button>
              {file && <span className="text-sm text-gray-500">{file.name}</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Modelos salvos</CardTitle>
              <p className="text-sm text-gray-500">Catalogo de documentos de referencia.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
                <Input
                  className="pl-8 w-56"
                  placeholder="Buscar modelo"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Badge variant="outline">{filtered.length} arquivos</Badge>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-sm text-gray-500">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">
                Nenhum modelo enviado ainda. Adicione arquivos para reutilizar em novos contratos.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2">Arquivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tpl) => (
                    <TableRow key={tpl.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{tpl.name}</p>
                            {tpl.filePath && (
                              <p className="text-xs text-gray-500 break-all">{tpl.filePath}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatType(tpl.fileName, tpl.fileType)}</TableCell>
                      <TableCell>{formatSize(Number(tpl.fileSize || 0))}</TableCell>
                      <TableCell>
                        {tpl.createdAt &&
                          new Date(tpl.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {tpl.filePath && (
                          <a
                            href={`${API_URL}${tpl.filePath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 text-sm inline-flex items-center gap-1 hover:underline"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                          <Dialog open={editing?.id === tpl.id} onOpenChange={(open) => setEditing(open ? tpl : null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-700 hover:text-blue-700">
                              <PencilLine className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar modelo</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <label className="text-sm text-gray-700">Nome</label>
                                  <Input
                                    value={editing?.name || ""}
                                    onChange={(e) =>
                                      setEditing((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-sm text-gray-700">Descricao</label>
                                  <Textarea
                                    value={editing?.description || ""}
                                    onChange={(e) =>
                                      setEditing((prev) =>
                                        prev ? { ...prev, description: e.target.value } : prev,
                                      )
                                    }
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditing(null)}>
                                  Cancelar
                                </Button>
                                <Button onClick={handleEdit} disabled={saving}>
                                  {saving ? "Salvando..." : "Salvar"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir modelo</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Essa acao remove o modelo para todos os usuarios do ecossistema. Deseja continuar?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(tpl.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Dialog
                            open={detail?.id === tpl.id}
                            onOpenChange={(open) => {
                              if (open) {
                                loadDetail(tpl.id);
                              } else {
                                setDetail(null);
                                setDetailHistory([]);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-gray-700 hover:text-blue-700">
                                <Info className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Detalhes do modelo</DialogTitle>
                              </DialogHeader>
                              {loadingDetail ? (
                                <div className="py-6 text-sm text-gray-500">Carregando detalhes...</div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="space-y-2 text-sm text-gray-700">
                                    <p>
                                      <span className="font-medium">Nome:</span> {detail?.name}
                                    </p>
                                    <p>
                                      <span className="font-medium">Descricao:</span>{" "}
                                      {detail?.description || "Sem descricao"}
                                    </p>
                                    <p>
                                      <span className="font-medium">Arquivo:</span> {detail?.fileName} (
                                      {formatType(detail?.fileName, detail?.fileType)})
                                    </p>
                                    <p>
                                      <span className="font-medium">Tamanho:</span>{" "}
                                      {formatSize(Number(detail?.fileSize || 0))}
                                    </p>
                                    <p>
                                      <span className="font-medium">Criado por:</span>{" "}
                                      {detail?.createdByName || "N/D"}
                                    </p>
                                    <p>
                                      <span className="font-medium">Criado em:</span>{" "}
                                      {detail?.createdAt
                                        ? new Date(detail.createdAt).toLocaleString("pt-BR")
                                        : "N/D"}
                                    </p>
                                    <p>
                                      <span className="font-medium">Atualizado em:</span>{" "}
                                      {detail?.updatedAt
                                        ? new Date(detail.updatedAt).toLocaleString("pt-BR")
                                        : "N/D"}
                                    </p>
                                    {detail?.filePath && (
                                      <p className="break-all">
                                        <span className="font-medium">Caminho:</span> {detail.filePath}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 mb-2">Historico</p>
                                    {detailHistory.length === 0 ? (
                                      <p className="text-sm text-gray-500">Sem eventos registrados.</p>
                                    ) : (
                                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        {detailHistory.map((h) => (
                                          <div key={h.id} className="rounded border border-gray-200 p-2 text-sm">
                                            <div className="flex justify-between text-gray-700">
                                              <span className="font-medium">
                                                {actionLabels[h.action] || h.action}
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                {new Date(h.createdAt).toLocaleString("pt-BR")}
                                              </span>
                                            </div>
                                            <p className="text-xs text-gray-600">
                                              Por: {h.createdByName || h.createdBy || "N/D"}
                                            </p>
                                            {h.changedFields && (
                                              <p className="text-xs text-gray-600">
                                                Campos: {Object.keys(h.changedFields).join(", ")}
                                              </p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDetail(null)}>
                                  Fechar
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
