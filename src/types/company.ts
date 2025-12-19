export interface Company {
  id: string;
  ecosystemId: string;
  name: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Party {
  id: string;
  ecosystemId: string;
  companyId?: string | null;
  companyName?: string | null;
  name: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}
