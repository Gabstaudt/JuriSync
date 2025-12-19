import { api, API_URL } from "@/lib/api";
import { Attachment, Conversation, Message } from "@/types/chat";

const getToken = () => localStorage.getItem("jurisync_token");

export const chatService = {
  listConversations: () => api.get<Conversation[]>("/api/chat/conversations"),
  createConversation: (participantIds: string[], message?: string, attachments?: Attachment[]) =>
    api.post<{ id: string; message?: Message }>(
      "/api/chat/conversations",
      { participantIds, message, attachments },
    ),
  listMessages: (conversationId: string) =>
    api.get<Message[]>(`/api/chat/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, payload: { content?: string; attachments?: Attachment[] }) =>
    api.post<Message>(`/api/chat/conversations/${conversationId}/messages`, payload),
  uploadAttachment: async (file: File): Promise<Attachment> => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/api/chat/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Erro ao enviar arquivo");
    }
    return (await res.json()) as Attachment;
  },
};
