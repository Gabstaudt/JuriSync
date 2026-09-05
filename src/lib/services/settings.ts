import { api, API_URL } from "@/lib/api";

export type NotificationSettings = {
  emailEnabled: boolean;
  contractExpiry: boolean;
  weeklyReport: boolean;
  commentNotifications: boolean;
  daysBeforeExpiry: number;
};

export type SettingsPayload = {
  notifications: NotificationSettings;
};

export const settingsService = {
  get: () => api.get<SettingsPayload>("/api/settings"),
  update: (payload: SettingsPayload) => api.patch<SettingsPayload>("/api/settings", payload),
  exportData: async () => {
    const token = localStorage.getItem("jurisync_token");
    const res = await fetch(`${API_URL}/api/settings/export`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Erro ao exportar dados");
    }
    const blob = await res.blob();
    const filename =
      res.headers.get("content-disposition")?.split("filename=")[1]?.replace(/\"/g, "") ||
      `jurisync-export-${new Date().toISOString().slice(0, 10)}.json`;
    return { blob, filename };
  },
};
