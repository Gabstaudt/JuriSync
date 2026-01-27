import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Team } from "@/types/team";
import { User } from "@/types/auth";
import { Folder } from "@/types/folder";

type Filters = {
  teamId: string;
  responsibleId: string;
  onlyMine: boolean;
  folderId: string;
  contractId: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: Team[];
  users: User[];
  folders: Folder[];
  contracts: { id: string; name: string }[];
  value: Filters;
  onApply: (filters: Filters) => void;
};

export function TaskFiltersModal({ open, onOpenChange, teams, users, folders, contracts, value, onApply }: Props) {
  const [local, setLocal] = useState<Filters>(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const responsibleOptions = useMemo(() => users.filter((u) => u.id), [users]);

  const handleApply = () => {
    onApply(local);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Filtros</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Time</Label>
            <Select value={local.teamId} onValueChange={(v) => setLocal((f) => ({ ...f, teamId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os times" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os times</SelectItem>
                {teams
                  .filter((t) => t.id)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id as string}>
                      {t.name || "Time"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Responsavel</Label>
            <Select value={local.responsibleId} onValueChange={(v) => setLocal((f) => ({ ...f, responsibleId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Qualquer responsavel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Qualquer um</SelectItem>
                {responsibleOptions.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pasta</Label>
            <Select value={local.folderId} onValueChange={(v) => setLocal((f) => ({ ...f, folderId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as pastas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {folders
                  .filter((f) => f.id)
                  .map((f) => (
                  <SelectItem key={f.id} value={f.id as string}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Contrato</Label>
            <Select value={local.contractId} onValueChange={(v) => setLocal((f) => ({ ...f, contractId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os contratos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {contracts
                  .filter((c) => c.id)
                  .map((c) => (
                  <SelectItem key={c.id} value={c.id as string}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <Checkbox
              id="only-mine"
              checked={local.onlyMine}
              onCheckedChange={(v) => setLocal((f) => ({ ...f, onlyMine: Boolean(v) }))}
            />
            <Label htmlFor="only-mine">Somente minhas</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleApply}>Aplicar filtros</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
