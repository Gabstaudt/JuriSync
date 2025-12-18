export type NotificationType = "info" | "warning" | "success" | "error";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}
