import {
  Contract,
  ContractStatus,
  ContractFilters,
  DashboardStats,
  ChartData,
} from "@/types/contract";
import { addDays, subDays, format, isWithinInterval, parseISO } from "date-fns";

// Mock data for development
export const mockContracts: Contract[] = [
  {
    id: "1",
    name: "Contrato de Prestação de Serviços - TI",
    contractingCompany: "Tech Solutions Ltda",
    contractedParty: "Digital Systems Inc",
    startDate: subDays(new Date(), 180),
    endDate: addDays(new Date(), 30),
    value: 120000,
    internalResponsible: "João Silva",
    responsibleEmail: "joao.silva@techsolutions.com",
    status: "expiring_soon",
    filePath: "/contracts/contract-1.pdf",
    fileName: "contrato-ti-2024.pdf",
    fileType: "pdf",
    createdAt: subDays(new Date(), 180),
    updatedAt: subDays(new Date(), 5),
    comments: [
      {
        id: "c1",
        contractId: "1",
        author: "Maria Santos",
        content: "Verificar renovação automática",
        createdAt: subDays(new Date(), 10),
      },
    ],
    history: [
      {
        id: "h1",
        contractId: "1",
        action: "Contrato criado",
        author: "João Silva",
        timestamp: subDays(new Date(), 180),
      },
      {
        id: "h2",
        contractId: "1",
        action: "Status atualizado",
        field: "status",
        oldValue: "active",
        newValue: "expiring_soon",
        author: "Sistema",
        timestamp: subDays(new Date(), 5),
      },
    ],
  },
  {
    id: "2",
    name: "Contrato de Locação - Escritório",
    contractingCompany: "Imobiliária Central",
    contractedParty: "Tech Solutions Ltda",
    startDate: subDays(new Date(), 365),
    endDate: addDays(new Date(), 365),
    value: 240000,
    internalResponsible: "Ana Costa",
    responsibleEmail: "ana.costa@techsolutions.com",
    status: "active",
    filePath: "/contracts/contract-2.docx",
    fileName: "contrato-locacao-escritorio.docx",
    fileType: "docx",
    createdAt: subDays(new Date(), 365),
    updatedAt: subDays(new Date(), 30),
    comments: [],
    history: [
      {
        id: "h3",
        contractId: "2",
        action: "Contrato criado",
        author: "Ana Costa",
        timestamp: subDays(new Date(), 365),
      },
    ],
  },
  {
    id: "3",
    name: "Contrato de Fornecimento - Materiais",
    contractingCompany: "Fornecedora ABC",
    contractedParty: "Tech Solutions Ltda",
    startDate: subDays(new Date(), 200),
    endDate: subDays(new Date(), 10),
    value: 85000,
    internalResponsible: "Carlos Lima",
    responsibleEmail: "carlos.lima@techsolutions.com",
    status: "expired",
    filePath: "/contracts/contract-3.pdf",
    fileName: "contrato-fornecimento-materiais.pdf",
    fileType: "pdf",
    createdAt: subDays(new Date(), 200),
    updatedAt: subDays(new Date(), 15),
    comments: [
      {
        id: "c2",
        contractId: "3",
        author: "Carlos Lima",
        content: "Contrato vencido - avaliar renovação",
        createdAt: subDays(new Date(), 15),
      },
    ],
    history: [
      {
        id: "h4",
        contractId: "3",
        action: "Contrato criado",
        author: "Carlos Lima",
        timestamp: subDays(new Date(), 200),
      },
      {
        id: "h5",
        contractId: "3",
        action: "Status atualizado",
        field: "status",
        oldValue: "active",
        newValue: "expired",
        author: "Sistema",
        timestamp: subDays(new Date(), 10),
      },
    ],
  },
  {
    id: "4",
    name: "Contrato de Manutenção - Equipamentos",
    contractingCompany: "Manutenção Pro",
    contractedParty: "Tech Solutions Ltda",
    startDate: subDays(new Date(), 90),
    endDate: addDays(new Date(), 3),
    value: 45000,
    internalResponsible: "Pedro Oliveira",
    responsibleEmail: "pedro.oliveira@techsolutions.com",
    status: "expiring_soon",
    filePath: "/contracts/contract-4.pdf",
    fileName: "contrato-manutencao-equipamentos.pdf",
    fileType: "pdf",
    createdAt: subDays(new Date(), 90),
    updatedAt: subDays(new Date(), 2),
    comments: [],
    history: [
      {
        id: "h6",
        contractId: "4",
        action: "Contrato criado",
        author: "Pedro Oliveira",
        timestamp: subDays(new Date(), 90),
      },
    ],
  },
  {
    id: "5",
    name: "Contrato de Consultoria - Financeiro",
    contractingCompany: "Consultoria XYZ",
    contractedParty: "Tech Solutions Ltda",
    startDate: subDays(new Date(), 60),
    endDate: addDays(new Date(), 300),
    value: 180000,
    internalResponsible: "Fernanda Rocha",
    responsibleEmail: "fernanda.rocha@techsolutions.com",
    status: "active",
    filePath: "/contracts/contract-5.docx",
    fileName: "contrato-consultoria-financeiro.docx",
    fileType: "docx",
    createdAt: subDays(new Date(), 60),
    updatedAt: subDays(new Date(), 1),
    comments: [
      {
        id: "c3",
        contractId: "5",
        author: "Fernanda Rocha",
        content: "Consultoria em andamento, resultados positivos",
        createdAt: subDays(new Date(), 30),
      },
    ],
    history: [
      {
        id: "h7",
        contractId: "5",
        action: "Contrato criado",
        author: "Fernanda Rocha",
        timestamp: subDays(new Date(), 60),
      },
    ],
  },
];

// Contract status calculation
export function calculateContractStatus(endDate: Date): ContractStatus {
  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (endDate.getTime() - now.getTime()) / (1000 * 3600 * 24),
  );

  if (daysUntilExpiry < 0) {
    return "expired";
  } else if (daysUntilExpiry <= 7) {
    return "expiring_soon";
  } else {
    return "active";
  }
}

// Filter contracts
export function filterContracts(
  contracts: Contract[],
  filters: ContractFilters,
): Contract[] {
  return contracts.filter((contract) => {
    // Status filter
    if (filters.status && contract.status !== filters.status) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchableText = [
        contract.name,
        contract.contractingCompany,
        contract.contractedParty,
        contract.internalResponsible,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(searchLower)) {
        return false;
      }
    }

    // Date range filter
    if (filters.startDate && contract.endDate < filters.startDate) {
      return false;
    }

    if (filters.endDate && contract.startDate > filters.endDate) {
      return false;
    }

    // Responsible filter
    if (
      filters.responsible &&
      contract.internalResponsible !== filters.responsible
    ) {
      return false;
    }

    // Company filter
    if (
      filters.contractingCompany &&
      contract.contractingCompany !== filters.contractingCompany
    ) {
      return false;
    }

    return true;
  });
}

// Get dashboard statistics
export function getDashboardStats(contracts: Contract[]): DashboardStats {
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter((c) => c.status === "active").length;
  const expiringSoonContracts = contracts.filter(
    (c) => c.status === "expiring_soon",
  ).length;
  const expiredContracts = contracts.filter(
    (c) => c.status === "expired",
  ).length;
  const totalValue = contracts.reduce((sum, c) => sum + c.value, 0);

  // Calculate monthly value (contracts expiring this month)
  const thisMonth = new Date();
  const startOfMonth = new Date(
    thisMonth.getFullYear(),
    thisMonth.getMonth(),
    1,
  );
  const endOfMonth = new Date(
    thisMonth.getFullYear(),
    thisMonth.getMonth() + 1,
    0,
  );

  const monthlyValue = contracts
    .filter((c) =>
      isWithinInterval(c.endDate, { start: startOfMonth, end: endOfMonth }),
    )
    .reduce((sum, c) => sum + c.value, 0);

  return {
    totalContracts,
    activeContracts,
    expiringSoonContracts,
    expiredContracts,
    totalValue,
    monthlyValue,
  };
}

// Get chart data
export function getChartData(contracts: Contract[]): ChartData {
  const contractsByStatus = [
    {
      status: "Ativos",
      count: contracts.filter((c) => c.status === "active").length,
      color: "#22c55e",
    },
    {
      status: "Vencendo em Breve",
      count: contracts.filter((c) => c.status === "expiring_soon").length,
      color: "#eab308",
    },
    {
      status: "Vencidos",
      count: contracts.filter((c) => c.status === "expired").length,
      color: "#ef4444",
    },
  ];

  // Generate monthly evolution data for the last 12 months
  const monthlyEvolution = [];
  const financialByMonth = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = format(date, "yyyy-MM");
    const monthLabel = format(date, "MMM yyyy");

    const monthContracts = contracts.filter(
      (c) => format(c.startDate, "yyyy-MM") === monthKey,
    );

    const monthExpiring = contracts.filter(
      (c) => format(c.endDate, "yyyy-MM") === monthKey,
    );

    monthlyEvolution.push({
      month: monthLabel,
      contracts: monthContracts.length,
      value: monthContracts.reduce((sum, c) => sum + c.value, 0),
    });

    financialByMonth.push({
      month: monthLabel,
      value: monthExpiring.reduce((sum, c) => sum + c.value, 0),
    });
  }

  return {
    contractsByStatus,
    monthlyEvolution,
    financialByMonth,
  };
}

// Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Format date
export function formatDate(date: Date): string {
  return format(date, "dd/MM/yyyy");
}

// Get status color
export function getStatusColor(status: ContractStatus): string {
  switch (status) {
    case "active":
      return "text-green-700 bg-green-50 border-green-200";
    case "expiring_soon":
      return "text-yellow-700 bg-yellow-50 border-yellow-200";
    case "expired":
      return "text-red-700 bg-red-50 border-red-200";
    default:
      return "text-gray-700 bg-gray-50 border-gray-200";
  }
}

// Get status label
export function getStatusLabel(status: ContractStatus): string {
  switch (status) {
    case "active":
      return "Ativo";
    case "expiring_soon":
      return "Vencendo em Breve";
    case "expired":
      return "Vencido";
    default:
      return "Desconhecido";
  }
}

// Simulate contract parsing from file
export async function parseContractFile(
  file: File,
): Promise<Partial<Contract>> {
  // This would normally integrate with a real PDF/DOCX parser
  // For now, we'll simulate the extraction

  return new Promise((resolve) => {
    setTimeout(() => {
      const mockExtractedData: Partial<Contract> = {
        name: `Contrato ${file.name.replace(/\.[^/.]+$/, "")}`,
        contractingCompany: "Empresa Exemplo Ltda",
        contractedParty: "Contratada Exemplo",
        startDate: new Date(),
        endDate: addDays(new Date(), 365),
        value: Math.floor(Math.random() * 200000) + 50000,
        internalResponsible: "Responsável Exemplo",
        responsibleEmail: "responsavel@exemplo.com",
        fileName: file.name,
        fileType: file.name.endsWith(".pdf") ? "pdf" : "docx",
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: [],
        history: [],
      };

      resolve(mockExtractedData);
    }, 2000); // Simulate processing time
  });
}

// Local storage utilities
const STORAGE_KEY = "jurisync_contracts";

export function saveContractsToStorage(contracts: Contract[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
}

export function loadContractsFromStorage(): Contract[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return mockContracts;

    const parsed = JSON.parse(stored);
    return parsed.map((contract: any) => ({
      ...contract,
      startDate: new Date(contract.startDate),
      endDate: new Date(contract.endDate),
      createdAt: new Date(contract.createdAt),
      updatedAt: new Date(contract.updatedAt),
      comments: contract.comments.map((comment: any) => ({
        ...comment,
        createdAt: new Date(comment.createdAt),
      })),
      history: contract.history.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      })),
    }));
  } catch (error) {
    console.error("Error loading contracts from storage:", error);
    return mockContracts;
  }
}

// Update contract status based on dates
export function updateContractStatuses(contracts: Contract[]): Contract[] {
  return contracts.map((contract) => ({
    ...contract,
    status: calculateContractStatus(contract.endDate),
  }));
}
