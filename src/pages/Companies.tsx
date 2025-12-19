import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Building2, Users, PlusCircle } from "lucide-react";
import { Company, Party } from "@/types/company";
import { companiesService, partiesService } from "@/lib/services/companies";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [parties, setParties] = useState<Party[]>([]);

  const [companyForm, setCompanyForm] = useState<Company>({
    id: "",
    name: "",
    cnpj: "",
    email: "",
    phone: "",
  });
  const [partyForm, setPartyForm] = useState<Party>({
    id: "",
    name: "",
    role: "",
    email: "",
    phone: "",
    company: "",
  });
  const [editCompanyModalOpen, setEditCompanyModalOpen] = useState(false);
  const [editPartyModalOpen, setEditPartyModalOpen] = useState(false);
  const [editCompanyForm, setEditCompanyForm] = useState({ id: "", name: "", cnpj: "", email: "", phone: "" });
  const [editPartyForm, setEditPartyForm] = useState({ id: "", name: "", role: "", email: "", phone: "", company: "" });

  const stats = useMemo(
    () => ({
      companies: companies.length,
      parties: parties.length,
    }),
    [companies.length, parties.length],
  );
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [c, p] = await Promise.all([companiesService.list(), partiesService.list()]);
      setCompanies(c);
      setParties(p);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao carregar dados");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCompany = async () => {
    if (!companyForm.name.trim()) return toast.error("Nome da empresa obrigatório");
    try {
      if (editingCompanyId) {
        const updated = await companiesService.update(editingCompanyId, {
          name: companyForm.name,
          cnpj: companyForm.cnpj,
          email: companyForm.email,
          phone: companyForm.phone,
        });
        setCompanies((prev) => prev.map((c) => (c.id === editingCompanyId ? updated : c)));
        toast.success("Empresa atualizada");
      } else {
        const created = await companiesService.create({
          name: companyForm.name,
          cnpj: companyForm.cnpj,
          email: companyForm.email,
          phone: companyForm.phone,
        });
        setCompanies((prev) => [created, ...prev]);
        toast.success("Empresa adicionada");
      }
      setCompanyForm({ id: "", name: "", cnpj: "", email: "", phone: "" });
      setEditingCompanyId(null);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar empresa");
    }
  };

  const handleAddParty = async () => {
    if (!partyForm.name.trim()) return toast.error("Nome da parte obrigatório");
    if (!partyForm.role.trim()) return toast.error("Defina o papel da parte");
    try {
      if (editingPartyId) {
        const updated = await partiesService.update(editingPartyId, {
          name: partyForm.name,
          role: partyForm.role,
          email: partyForm.email,
          phone: partyForm.phone,
          companyId: partyForm.company || null,
        });
        setParties((prev) => prev.map((p) => (p.id === editingPartyId ? updated : p)));
        toast.success("Parte atualizada");
      } else {
        const created = await partiesService.create({
          name: partyForm.name,
          role: partyForm.role,
          email: partyForm.email,
          phone: partyForm.phone,
          companyId: partyForm.company || null,
        });
        setParties((prev) => [created, ...prev]);
        toast.success("Parte adicionada");
      }
      setPartyForm({ id: "", name: "", role: "", email: "", phone: "", company: "" });
      setEditingPartyId(null);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar parte");
    }
  };

  const handleEditCompany = (c: Company) => {
    setEditingCompanyId(c.id);
    setEditCompanyForm({
      id: c.id,
      name: c.name,
      cnpj: c.cnpj || "",
      email: c.email || "",
      phone: c.phone || "",
    });
    setEditCompanyModalOpen(true);
  };

  const handleDeleteCompany = async (id: string) => {
    if (!window.confirm("Você tem certeza que deseja excluir esta empresa?")) return;
    try {
      await companiesService.remove(id);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      setParties((prev) => prev.map((p) => (p.companyId === id ? { ...p, companyId: null, companyName: null } : p)));
      if (editingCompanyId === id) {
        setEditingCompanyId(null);
        setCompanyForm({ id: "", name: "", cnpj: "", email: "", phone: "" });
      }
      toast.success("Empresa excluída");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao excluir empresa");
    }
  };

  const handleEditParty = (p: Party) => {
    setEditingPartyId(p.id);
    setEditPartyForm({
      id: p.id,
      name: p.name,
      role: p.role,
      email: p.email || "",
      phone: p.phone || "",
      company: p.companyId || "",
    });
    setEditPartyModalOpen(true);
  };

  const handleDeleteParty = async (id: string) => {
    if (!window.confirm("Você tem certeza que deseja excluir esta parte?")) return;
    try {
      await partiesService.remove(id);
      setParties((prev) => prev.filter((p) => p.id !== id));
      if (editingPartyId === id) {
        setEditingPartyId(null);
        setPartyForm({ id: "", name: "", role: "", email: "", phone: "", company: "" });
      }
      toast.success("Parte excluída");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao excluir parte");
    }
  };

  const handleUpdateCompany = async () => {
    if (!editingCompanyId) return;
    if (!editCompanyForm.name.trim()) return toast.error("Nome da empresa é obrigatório");
    try {
      const updated = await companiesService.update(editingCompanyId, {
        name: editCompanyForm.name,
        cnpj: editCompanyForm.cnpj,
        email: editCompanyForm.email,
        phone: editCompanyForm.phone,
      });
      setCompanies((prev) => prev.map((c) => (c.id === editingCompanyId ? updated : c)));
      setEditCompanyModalOpen(false);
      setEditingCompanyId(null);
      toast.success("Empresa atualizada");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao atualizar empresa");
    }
  };

  const handleUpdateParty = async () => {
    if (!editingPartyId) return;
    if (!editPartyForm.name.trim() || !editPartyForm.role.trim()) {
      toast.error("Nome e papel são obrigatórios");
      return;
    }
    try {
      const updated = await partiesService.update(editingPartyId, {
        name: editPartyForm.name,
        role: editPartyForm.role,
        email: editPartyForm.email,
        phone: editPartyForm.phone,
        companyId: editPartyForm.company || null,
      });
      setParties((prev) => prev.map((p) => (p.id === editingPartyId ? updated : p)));
      setEditPartyModalOpen(false);
      setEditingPartyId(null);
      toast.success("Parte atualizada");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao atualizar parte");
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Cadastro de contrapartes</p>
            <h1 className="text-2xl font-semibold text-gray-900">Empresas e Partes</h1>
          </div>
          <Badge variant="outline">Beta</Badge>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="companies">Empresas</TabsTrigger>
            <TabsTrigger value="parties">Partes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Empresas</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-3xl font-semibold">{stats.companies}</div>
                  <Building2 className="h-8 w-8 text-blue-600" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Partes</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-3xl font-semibold">{stats.parties}</div>
                  <Users className="h-8 w-8 text-emerald-600" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Integridade</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Mantenha empresas e partes atualizados para amarrar contratos e contatos.
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="companies">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-blue-600" />
                    Adicionar empresa
                  </CardTitle>
                  <CardDescription>Cadastre a empresa vinculada aos contratos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Nome da empresa"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  <Input
                    placeholder="CNPJ (opcional)"
                    value={companyForm.cnpj}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, cnpj: e.target.value }))}
                  />
                  <Input
                    placeholder="E-mail"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, email: e.target.value }))}
                  />
                  <Input
                    placeholder="Telefone"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                  <Button className="w-full" onClick={handleAddCompany}>
                    {editingCompanyId ? "Atualizar empresa" : "Salvar empresa"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Empresas cadastradas</CardTitle>
                  <CardDescription>Lista local (apenas para demonstração).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {companies.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma empresa cadastrada.</p>
                  ) : (
                    companies.map((c) => (
                      <div
                        key={c.id}
                        className="border rounded-lg p-3 flex items-start justify-between"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.cnpj || "CNPJ não informado"}</p>
                          <p className="text-xs text-gray-500">{c.email || "Sem e-mail"}</p>
                          <p className="text-xs text-gray-500">{c.phone || "Sem telefone"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Empresa</Badge>
                          <Button size="sm" variant="ghost" onClick={() => handleEditCompany(c)}>
                            Editar
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteCompany(c.id)}>
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="parties">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-emerald-600" />
                    Adicionar parte
                  </CardTitle>
                  <CardDescription>Pessoas de contato ou representantes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Nome da parte"
                    value={partyForm.name}
                    onChange={(e) => setPartyForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Papel (ex: Representante Legal)"
                    value={partyForm.role}
                    onChange={(e) => setPartyForm((p) => ({ ...p, role: e.target.value }))}
                  />
                  <Input
                    placeholder="E-mail"
                    value={partyForm.email}
                    onChange={(e) => setPartyForm((p) => ({ ...p, email: e.target.value }))}
                  />
                  <Input
                    placeholder="Telefone"
                    value={partyForm.phone}
                    onChange={(e) => setPartyForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                  <Select
                    value={partyForm.company}
                    onValueChange={(val) => setPartyForm((p) => ({ ...p, company: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vincular a uma empresa (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button className="w-full" onClick={handleAddParty}>
                    {editingPartyId ? "Atualizar parte" : "Salvar parte"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Partes cadastradas</CardTitle>
                  <CardDescription>Lista local (apenas para demonstração).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {parties.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma parte cadastrada.</p>
                  ) : (
                    parties.map((p) => (
                      <div
                        key={p.id}
                        className="border rounded-lg p-3 flex items-start justify-between"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.role}</p>
                          <p className="text-xs text-gray-500">{p.email || "Sem e-mail"}</p>
                          <p className="text-xs text-gray-500">{p.phone || "Sem telefone"}</p>
                          {p.companyName && (
                            <p className="text-xs text-gray-500">Empresa: {p.companyName}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Parte</Badge>
                          <Button size="sm" variant="ghost" onClick={() => handleEditParty(p)}>
                            Editar
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteParty(p.id)}>
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />
        <p className="text-xs text-gray-500">
          Observação: esta tela usa dados locais para demonstrar a experiência. Integração com API pode
          ser plugada em seguida para persistência real.
        </p>
      </div>

      <Dialog open={editCompanyModalOpen} onOpenChange={setEditCompanyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar empresa</DialogTitle>
            <DialogDescription>Atualize os dados da empresa selecionada.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nome da empresa"
              value={editCompanyForm.name}
              onChange={(e) => setEditCompanyForm((p) => ({ ...p, name: e.target.value }))}
            />
            <Input
              placeholder="CNPJ"
              value={editCompanyForm.cnpj}
              onChange={(e) => setEditCompanyForm((p) => ({ ...p, cnpj: e.target.value }))}
            />
            <Input
              placeholder="E-mail"
              value={editCompanyForm.email}
              onChange={(e) => setEditCompanyForm((p) => ({ ...p, email: e.target.value }))}
            />
            <Input
              placeholder="Telefone"
              value={editCompanyForm.phone}
              onChange={(e) => setEditCompanyForm((p) => ({ ...p, phone: e.target.value }))}
            />
            <Button onClick={handleUpdateCompany}>Salvar alterações</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editPartyModalOpen} onOpenChange={setEditPartyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar parte</DialogTitle>
            <DialogDescription>Atualize os dados da parte selecionada.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nome da parte"
              value={editPartyForm.name}
              onChange={(e) => setEditPartyForm((p) => ({ ...p, name: e.target.value }))}
            />
            <Input
              placeholder="Papel"
              value={editPartyForm.role}
              onChange={(e) => setEditPartyForm((p) => ({ ...p, role: e.target.value }))}
            />
            <Input
              placeholder="E-mail"
              value={editPartyForm.email}
              onChange={(e) => setEditPartyForm((p) => ({ ...p, email: e.target.value }))}
            />
            <Input
              placeholder="Telefone"
              value={editPartyForm.phone}
              onChange={(e) => setEditPartyForm((p) => ({ ...p, phone: e.target.value }))}
            />
            <Select
              value={editPartyForm.company}
              onValueChange={(val) => setEditPartyForm((p) => ({ ...p, company: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vincular empresa (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleUpdateParty}>Salvar alterações</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
