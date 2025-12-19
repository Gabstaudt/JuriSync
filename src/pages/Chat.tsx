import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { chatService } from "@/lib/services/chat";
import { API_URL } from "@/lib/api";
import { Conversation, Message } from "@/types/chat";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquarePlus, Paperclip, Send } from "lucide-react";
import { usersService } from "@/lib/services/users";
import { useLocation } from "react-router-dom";

const formatWhen = (value?: string) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [users, setUsers] = useState<
    { id: string; name: string; email: string; role?: string }[]
  >([]);
  const location = useLocation();

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId],
  );

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const data = await chatService.listConversations();
      setConversations(data);
      // Se veio com query ?conversation=xxx, prioriza
      const searchParams = new URLSearchParams(location.search);
      const fromQuery = searchParams.get("conversation");
      if (fromQuery && data.find((c) => c.id === fromQuery)) {
        setSelectedId(fromQuery);
      } else {
        setSelectedId((current) => current ?? (data[0]?.id ?? null));
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao carregar conversas");
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const data = await chatService.listMessages(conversationId);
      setMessages(data);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao carregar mensagens");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const data = await usersService.list();
        const mapped = data
          .filter((u) => u.id && u.id !== user?.id)
          .map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
          }));
        setUsers(mapped);
      } catch (e: any) {
        toast.error(e?.message || "Erro ao carregar usuarios do ecossistema");
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, [user?.id]);

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
    } else {
      setMessages([]);
    }
  }, [selectedId]);

  const handleCreateConversation = async () => {
    if (!targetUserId.trim()) {
      toast.error("Selecione o destinatario");
      return;
    }
    setCreating(true);
    try {
      const { id } = await chatService.createConversation([targetUserId.trim()]);
      setTargetUserId("");
      await loadConversations();
      setSelectedId(id);
      await loadMessages(id);
      toast.success("Conversa criada");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao criar conversa");
    } finally {
      setCreating(false);
    }
  };

  const handleSelectUser = async (userId: string) => {
    setTargetUserId(userId);
    if (!userId) return;
    // Cria (ou reutiliza) a conversa e abre imediatamente
    setCreating(true);
    try {
      const { id } = await chatService.createConversation([userId]);
      await loadConversations();
      setSelectedId(id);
      await loadMessages(id);
      toast.success("Conversa aberta");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao abrir conversa");
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async () => {
    if (!selectedId) {
      toast.error("Selecione uma conversa");
      return;
    }
    if (!newMessage.trim() && files.length === 0) {
      toast.error("Mensagem vazia");
      return;
    }
    setSending(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const uploadedFile = await chatService.uploadAttachment(file);
        uploaded.push(uploadedFile);
      }
      const message = await chatService.sendMessage(selectedId, {
        content: newMessage.trim(),
        attachments: uploaded,
      });
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
      setFiles([]);
      loadConversations();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const renderConversationLabel = (conv: Conversation) => {
    if (conv.title) return conv.title;
    return conv.participants
      .map((p) => p.name || p.email || p.id.slice(0, 6))
      .join(", ");
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Mensagens privadas no ecossistema</p>
            <h1 className="text-2xl font-semibold text-gray-900">Chat interno</h1>
          </div>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
            Beta
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquarePlus className="h-4 w-4 text-blue-600" />
                Nova conversa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={targetUserId} onValueChange={handleSelectUser} disabled={creating || loadingUsers}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingUsers ? "Carregando..." : "Selecione o destinatario"} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!users.length && !loadingUsers && (
                <p className="text-xs text-gray-500">Nenhum usuario encontrado neste ecossistema.</p>
              )}
              <Button className="w-full" onClick={handleCreateConversation} disabled={creating || !targetUserId}>
                {creating ? "Abrindo..." : "Abrir chat"}
              </Button>
              <Separator />
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Conversas</span>
                {loadingConversations && <span>carregando...</span>}
              </div>
              <ScrollArea className="h-[420px] pr-2">
                <div className="space-y-2">
                  {conversations.map((conv) => {
                    const active = selectedId === conv.id;
                    const preview =
                      conv.lastMessage?.content ||
                      (conv.lastMessage?.attachments?.length ? "Arquivo enviado" : "Sem mensagens");
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedId(conv.id)}
                        className={`w-full text-left rounded-lg border px-3 py-2 transition ${
                          active
                            ? "border-blue-200 bg-blue-50"
                            : "border-gray-200 hover:border-blue-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {renderConversationLabel(conv)}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-1">{preview}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] text-gray-400">{formatWhen(conv.lastMessageAt)}</p>
                            {conv.unreadCount > 0 && (
                              <span className="text-[11px] px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {!conversations.length && (
                    <p className="text-xs text-gray-500">Nenhuma conversa encontrada.</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Conversa</p>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedConversation ? renderConversationLabel(selectedConversation) : "Selecione um chat"}
                  </h2>
                </div>
                {loadingMessages && <span className="text-sm text-gray-500">carregando...</span>}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="h-[420px] border rounded-lg p-3 bg-white">
                <ScrollArea className="h-full pr-2">
                  <div className="space-y-3">
                    {messages.map((m) => {
                      const isSelf = m.senderId && user?.id === m.senderId;
                      return (
                        <div
                          key={m.id}
                          className={`rounded-lg border px-3 py-2 ${
                            isSelf ? "border-blue-200 bg-blue-50" : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>{m.senderName || m.senderEmail || m.senderId || "Usuario"}</span>
                            <span>{formatWhen(m.createdAt)}</span>
                          </div>
                          {m.content && <p className="text-sm text-gray-900">{m.content}</p>}
                          {m.attachments?.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {m.attachments.map((att) => (
                                <a
                                  key={att.filePath}
                                  href={`${API_URL}${att.filePath}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs px-2 py-1 rounded bg-gray-100 text-blue-700 inline-flex items-center gap-1"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  {att.fileName || att.filePath}
                                </a>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                    {!messages.length && (
                      <p className="text-sm text-gray-500">Nenhuma mensagem. Envie a primeira.</p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Escreva sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    className="max-w-xs"
                  />
                  {files.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {files.length} arquivo(s) pronto(s) para envio
                    </span>
                  )}
                  <Button className="ml-auto" onClick={handleSend} disabled={sending || !selectedId}>
                    {sending ? (
                      "Enviando..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
