export type ProcessStatus = "ativo" | "em_andamento" | "encerrado";
export type ProcessContingency = "alta" | "possivel" | "remota";

export interface Process {
  id: string;
  title: string;
  description?: string | null;
  status: ProcessStatus;
  folderId?: string | null;
  involvedParties?: string[];
  responsibleId?: string | null;
  notes?: string | null;
  actionGroup?: string | null;
  phase?: string | null;
  cnjNumber?: string | null;
  protocolNumber?: string | null;
  originProcess?: string | null;
  requestDate?: string | null;
  claimValue?: number | null;
  feesValue?: number | null;
  feesPercentage?: number | null;
  contingency?: ProcessContingency | null;
  ecosystemId?: string;
  createdBy?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
