import { Contract, ExportOptions, ChartData } from "@/types/contract";
import { formatDate, formatCurrency, getStatusLabel } from "./contracts";

// Export contracts to CSV
export function exportContractsToCSV(
  contracts: Contract[],
  options: ExportOptions,
): void {
  const headers = [
    "Nome do Contrato",
    "Empresa Contratante",
    "Parte Contratada",
    "Data de Início",
    "Data de Vencimento",
    "Valor",
    "Responsável",
    "Email do Responsável",
    "Status",
    "Arquivo",
    "Data de Criação",
  ];

  const filteredContracts = filterContractsForExport(contracts, options);

  const csvData = filteredContracts.map((contract) => [
    `"${contract.name}"`,
    `"${contract.contractingCompany}"`,
    `"${contract.contractedParty}"`,
    formatDate(contract.startDate),
    formatDate(contract.endDate),
    contract.value.toString(),
    `"${contract.internalResponsible}"`,
    contract.responsibleEmail,
    getStatusLabel(contract.status),
    contract.fileName || "",
    formatDate(contract.createdAt),
  ]);

  const csvContent = [
    headers.join(","),
    ...csvData.map((row) => row.join(",")),
  ].join("\n");

  downloadFile(csvContent, "contratos-jurisync.csv", "text/csv");
}

// Filter contracts based on export options
function filterContractsForExport(
  contracts: Contract[],
  options: ExportOptions,
): Contract[] {
  let filtered = contracts;

  // Filter by status
  if (!options.includeActive) {
    filtered = filtered.filter((c) => c.status !== "active");
  }
  if (!options.includeExpired) {
    filtered = filtered.filter((c) => c.status !== "expired");
  }
  if (!options.includeExpiringSoon) {
    filtered = filtered.filter((c) => c.status !== "expiring_soon");
  }

  // Filter by date range
  if (options.dateRange) {
    filtered = filtered.filter(
      (contract) =>
        contract.endDate >= options.dateRange!.start &&
        contract.endDate <= options.dateRange!.end,
    );
  }

  return filtered;
}

// Generate dashboard PDF (simulated)
export async function exportDashboardToPDF(
  contracts: Contract[],
  chartData: ChartData,
  options: ExportOptions,
): Promise<void> {
  const filteredContracts = filterContractsForExport(contracts, options);

  // In a real implementation, this would use a library like jsPDF or Puppeteer
  // For now, we'll create an HTML version that can be printed as PDF

  const htmlContent = generateDashboardHTML(filteredContracts, chartData);

  // Open in new window for printing
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load then trigger print dialog
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  }
}

// Generate HTML for dashboard export
function generateDashboardHTML(
  contracts: Contract[],
  chartData: ChartData,
): string {
  const totalValue = contracts.reduce((sum, c) => sum + c.value, 0);
  const activeCount = contracts.filter((c) => c.status === "active").length;
  const expiringSoonCount = contracts.filter(
    (c) => c.status === "expiring_soon",
  ).length;
  const expiredCount = contracts.filter((c) => c.status === "expired").length;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard JuriSync - ${formatDate(new Date())}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2563eb;
          margin: 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .stat-value {
          font-size: 2em;
          font-weight: bold;
          margin: 10px 0;
        }
        .stat-label {
          color: #6b7280;
          font-size: 0.9em;
        }
        .active { color: #22c55e; }
        .expiring { color: #eab308; }
        .expired { color: #ef4444; }
        .total { color: #2563eb; }
        .contracts-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 30px;
        }
        .contracts-table th,
        .contracts-table td {
          border: 1px solid #e5e7eb;
          padding: 12px;
          text-align: left;
        }
        .contracts-table th {
          background-color: #f9fafb;
          font-weight: bold;
        }
        .status-active { color: #22c55e; }
        .status-expiring { color: #eab308; }
        .status-expired { color: #ef4444; }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #6b7280;
          font-size: 0.9em;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Dashboard JuriSync</h1>
        <p>Relatório de Contratos - ${formatDate(new Date())}</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value total">${contracts.length}</div>
          <div class="stat-label">Total de Contratos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value active">${activeCount}</div>
          <div class="stat-label">Contratos Ativos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value expiring">${expiringSoonCount}</div>
          <div class="stat-label">Vencendo em Breve</div>
        </div>
        <div class="stat-card">
          <div class="stat-value expired">${expiredCount}</div>
          <div class="stat-label">Contratos Vencidos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value total">${formatCurrency(totalValue)}</div>
          <div class="stat-label">Valor Total</div>
        </div>
      </div>

      <table class="contracts-table">
        <thead>
          <tr>
            <th>Nome do Contrato</th>
            <th>Empresa</th>
            <th>Responsável</th>
            <th>Data de Vencimento</th>
            <th>Valor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${contracts
            .map(
              (contract) => `
            <tr>
              <td>${contract.name}</td>
              <td>${contract.contractingCompany}</td>
              <td>${contract.internalResponsible}</td>
              <td>${formatDate(contract.endDate)}</td>
              <td>${formatCurrency(contract.value)}</td>
              <td class="status-${contract.status === "active" ? "active" : contract.status === "expiring_soon" ? "expiring" : "expired"}">
                ${getStatusLabel(contract.status)}
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <div class="footer">
        <p>Relatório gerado pelo sistema JuriSync em ${new Date().toLocaleString("pt-BR")}</p>
        <p>Este documento contém informações confidenciais sobre contratos da empresa.</p>
      </div>
    </body>
    </html>
  `;
}

// Export contracts summary to JSON (for API integration)
export function exportContractsToJSON(
  contracts: Contract[],
  options: ExportOptions,
): string {
  const filteredContracts = filterContractsForExport(contracts, options);

  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      totalRecords: filteredContracts.length,
      options,
    },
    contracts: filteredContracts.map((contract) => ({
      id: contract.id,
      name: contract.name,
      contractingCompany: contract.contractingCompany,
      contractedParty: contract.contractedParty,
      startDate: contract.startDate.toISOString(),
      endDate: contract.endDate.toISOString(),
      value: contract.value,
      internalResponsible: contract.internalResponsible,
      responsibleEmail: contract.responsibleEmail,
      status: contract.status,
      fileName: contract.fileName,
      fileType: contract.fileType,
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

// Download file utility
function downloadFile(
  content: string,
  filename: string,
  contentType: string,
): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// Export filtered contracts with custom options
export async function exportWithOptions(
  contracts: Contract[],
  format: "csv" | "pdf" | "json",
  options: ExportOptions,
  chartData?: ChartData,
): Promise<void> {
  switch (format) {
    case "csv":
      exportContractsToCSV(contracts, options);
      break;
    case "pdf":
      if (chartData) {
        await exportDashboardToPDF(contracts, chartData, options);
      }
      break;
    case "json":
      const jsonContent = exportContractsToJSON(contracts, options);
      downloadFile(jsonContent, "contratos-jurisync.json", "application/json");
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

// Generate quick export presets
export const exportPresets = {
  allContracts: (): ExportOptions => ({
    format: "csv",
    includeActive: true,
    includeExpired: true,
    includeExpiringSoon: true,
  }),

  activeOnly: (): ExportOptions => ({
    format: "csv",
    includeActive: true,
    includeExpired: false,
    includeExpiringSoon: false,
  }),

  expiringContracts: (): ExportOptions => ({
    format: "csv",
    includeActive: false,
    includeExpired: true,
    includeExpiringSoon: true,
  }),

  monthlyReport: (): ExportOptions => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      format: "pdf",
      includeActive: true,
      includeExpired: true,
      includeExpiringSoon: true,
      dateRange: {
        start: startOfMonth,
        end: endOfMonth,
      },
    };
  },
};
