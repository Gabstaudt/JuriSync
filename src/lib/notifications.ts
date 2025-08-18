import { Contract } from "@/types/contract";
import { addDays, format, differenceInDays } from "date-fns";

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  contractId: string;
  type: "expiry_reminder" | "expiry_warning";
}

// Check which contracts need notifications
export function getContractsNeedingNotification(
  contracts: Contract[],
): Contract[] {
  const today = new Date();

  return contracts.filter((contract) => {
    const daysUntilExpiry = differenceInDays(contract.endDate, today);

    // Send notification 7 days before expiry or on expiry day
    return daysUntilExpiry === 7 || daysUntilExpiry === 0;
  });
}

// Generate email notification
export function generateEmailNotification(
  contract: Contract,
): EmailNotification {
  const today = new Date();
  const daysUntilExpiry = differenceInDays(contract.endDate, today);

  const isExpiryDay = daysUntilExpiry === 0;
  const isWarning = daysUntilExpiry === 7;

  const subject = isExpiryDay
    ? `🚨 URGENTE: Contrato "${contract.name}" vence hoje!`
    : `⚠️ ALERTA: Contrato "${contract.name}" vence em 7 dias`;

  const urgencyText = isExpiryDay ? "VENCE HOJE" : "VENCE EM 7 DIAS";
  const actionText = isExpiryDay
    ? "necessária ação imediata para renovação ou encerramento."
    : "recomendamos iniciar o processo de renovação.";

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${isExpiryDay ? "#fee2e2" : "#fef3c7"}; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: ${isExpiryDay ? "#dc2626" : "#d97706"}; margin: 0;">
          ${urgencyText}: ${contract.name}
        </h2>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #374151;">Detalhes do Contrato</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Nome:</td>
            <td style="padding: 8px 0; color: #111827;">${contract.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Empresa Contratante:</td>
            <td style="padding: 8px 0; color: #111827;">${contract.contractingCompany}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Parte Contratada:</td>
            <td style="padding: 8px 0; color: #111827;">${contract.contractedParty}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Data de Vencimento:</td>
            <td style="padding: 8px 0; color: ${isExpiryDay ? "#dc2626" : "#d97706"}; font-weight: bold;">
              ${format(contract.endDate, "dd/MM/yyyy")}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Valor:</td>
            <td style="padding: 8px 0; color: #111827;">
              ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(contract.value)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Responsável:</td>
            <td style="padding: 8px 0; color: #111827;">${contract.internalResponsible}</td>
          </tr>
        </table>
      </div>
      
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0; color: #0f172a;">
          <strong>Ação Necessária:</strong> Este contrato ${urgencyText.toLowerCase()}, ${actionText}
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${getContractUrl(contract.id)}" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Ver Contrato no Sistema
        </a>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
        <p>Este é um e-mail automático do sistema JuriSync.</p>
        <p>Para mais informações, acesse o sistema ou entre em contato com o administrador.</p>
      </div>
    </div>
  `;

  return {
    to: contract.responsibleEmail,
    subject,
    body,
    contractId: contract.id,
    type: isExpiryDay ? "expiry_warning" : "expiry_reminder",
  };
}

// Generate contract URL (would be actual URL in production)
function getContractUrl(contractId: string): string {
  return `${window.location.origin}/contracts/${contractId}`;
}

// Simulate sending email (in production, this would integrate with an email service)
export async function sendEmailNotification(
  notification: EmailNotification,
): Promise<boolean> {
  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // In production, this would use a service like SendGrid, Amazon SES, etc.
  console.log("Email notification sent:", {
    to: notification.to,
    subject: notification.subject,
    contractId: notification.contractId,
    type: notification.type,
  });

  // Simulate success/failure (95% success rate)
  return Math.random() > 0.05;
}

// Send notifications for multiple contracts
export async function sendBulkNotifications(contracts: Contract[]): Promise<{
  sent: number;
  failed: number;
  notifications: EmailNotification[];
}> {
  const notifications = contracts.map(generateEmailNotification);
  let sent = 0;
  let failed = 0;

  for (const notification of notifications) {
    try {
      const success = await sendEmailNotification(notification);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
      failed++;
    }
  }

  return { sent, failed, notifications };
}

// Check and send daily notifications (this would be called by a cron job)
export async function checkAndSendDailyNotifications(
  contracts: Contract[],
): Promise<void> {
  const contractsNeedingNotification =
    getContractsNeedingNotification(contracts);

  if (contractsNeedingNotification.length > 0) {
    const result = await sendBulkNotifications(contractsNeedingNotification);
    console.log(
      `Daily notifications sent: ${result.sent} successful, ${result.failed} failed`,
    );
  }
}

// Get notification history (mock data)
export interface NotificationHistory {
  id: string;
  contractId: string;
  contractName: string;
  type: "expiry_reminder" | "expiry_warning";
  recipient: string;
  sentAt: Date;
  status: "sent" | "failed" | "pending";
}

export function getNotificationHistory(): NotificationHistory[] {
  // This would come from a database in production
  return [
    {
      id: "n1",
      contractId: "1",
      contractName: "Contrato de Prestação de Serviços - TI",
      type: "expiry_reminder",
      recipient: "joao.silva@techsolutions.com",
      sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: "sent",
    },
    {
      id: "n2",
      contractId: "4",
      contractName: "Contrato de Manutenção - Equipamentos",
      type: "expiry_reminder",
      recipient: "pedro.oliveira@techsolutions.com",
      sentAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      status: "sent",
    },
  ];
}
