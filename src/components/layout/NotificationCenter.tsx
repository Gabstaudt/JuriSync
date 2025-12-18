import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Clock, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { notificationsService } from "@/lib/services/notifications";
import { Notification } from "@/types/notification";
import { API_URL } from "@/lib/api";

export function NotificationCenter() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<EventSource | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsService.list();
      setNotifications(data);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao carregar notificacoes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      await fetchNotifications();
    };
    load();
    const token = localStorage.getItem("jurisync_token");
    if (token) {
      const es = new EventSource(`${API_URL}/api/notifications/stream?token=${token}`);
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "notification" && payload.data) {
            setNotifications((prev) => [payload.data as Notification, ...prev]);
          }
        } catch {
          // ignore parse errors
        }
      };
      es.onerror = () => {
        es.close();
      };
      setSource(es);
    }
    return () => {
      active = false;
      if (source) source.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
    );
    try {
      await notificationsService.markRead(notificationId);
    } catch {
      // ignora erro
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationsService.markAll();
      toast.success("Todas as notificacoes foram marcadas como lidas");
    } catch {
      toast.error("Nao foi possivel marcar todas como lidas");
    }
  };

  const removeNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "success":
        return <Check className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const dt = new Date(date);
    const diffInHours = Math.floor((now.getTime() - dt.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return "Agora mesmo";
    if (diffInHours < 24) return `${diffInHours}h atras`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atras`;
  };

  const handleNavigate = (actionUrl?: string | null) => {
    if (!actionUrl) return;
    setIsOpen(false);
    navigate(actionUrl);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative" onClick={fetchNotifications}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificacoes</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                  disabled={loading}
                >
                  Marcar todas como lidas
                </Button>
              )}
            </div>
            {unreadCount > 0 && (
              <CardDescription>
                {unreadCount} notificacao{unreadCount > 1 ? "es" : ""} nao lida
                {unreadCount > 1 ? "s" : ""}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{loading ? "Carregando..." : "Nenhuma notificacao"}</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className={`p-4 hover:bg-muted/50 cursor-pointer ${
                        !notification.isRead ? "bg-blue-50/50" : ""
                      }`}
                      onClick={() => {
                        markAsRead(notification.id);
                        handleNavigate(notification.actionUrl);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">
                              {notification.title}
                            </p>
                            <div className="flex items-center gap-1 ml-2">
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                }}
                                className="h-6 w-6 p-0 hover:bg-red-100"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {getTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator />}
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <>
                <Separator />
                <div className="p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm"
                    onClick={() => {
                      setIsOpen(false);
                      toast.info("Pagina de notificacoes em desenvolvimento");
                    }}
                  >
                    Ver todas as notificacoes
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
