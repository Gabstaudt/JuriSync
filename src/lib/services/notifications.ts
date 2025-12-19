import { api } from "@/lib/api";
import { Notification } from "@/types/notification";

export const notificationsService = {
  list: () => api.get<Notification[]>("/api/notifications"),
  markRead: (id: string) => api.patch<{ ok: boolean }>("/api/notifications", { id }),
  markAll: () => api.patch<{ ok: boolean }>("/api/notifications", { markAll: true }),
};
