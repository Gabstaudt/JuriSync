import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  FileText,
  LayoutDashboard,
  FolderOpen,
  Users,
  Settings,
  BarChart3,
  Bell,
  Archive,
  Shield,
  Plus,
  X,
  MessageSquare,
  Building2,
} from "lucide-react";
import { chatService } from "@/lib/services/chat";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadChat, setUnreadChat] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchUnread = async () => {
      try {
        const convs = await chatService.listConversations();
        if (!active) return;
        const total = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadChat(total);
      } catch {
        // silencioso
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      badge: null,
    },
    {
      label: "Contratos",
      icon: FileText,
      href: "/contracts",
      badge: "12",
    },
    {
      label: "Pastas",
      icon: FolderOpen,
      href: "/folders",
      badge: null,
    },
    {
      label: "Chat",
      icon: MessageSquare,
      href: "/chat",
      badge: null,
    },
    {
      label: "Empresas e Partes",
      icon: Building2,
      href: "/companies",
      badge: null,
    },
    {
      label: "Análises",
      icon: BarChart3,
      href: "/analytics",
      badge: null,
      permission: "canAccessAnalytics",
    },
  ];

  const adminItems = [
    {
      label: "Usuários",
      icon: Users,
      href: "/users",
      badge: null,
      permission: "canManageUsers",
    },
    {
      label: "Configurações",
      icon: Settings,
      href: "/settings",
      badge: null,
    },
  ];

  const quickActions = [
    {
      label: "Novo Contrato",
      icon: Plus,
      action: () => navigate("/contracts/new"),
      permission: "canCreateContracts",
    },
    {
      label: "Nova Pasta",
      icon: FolderOpen,
      action: () => {
        navigate("/folders/new");
        onClose();
      },
      permission: "canCreateFolders",
    },
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
    onClose(); // Close mobile sidebar
  };

  const isActive = (href: string) => {
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
                JS
              </div>
              <div className="flex flex-col leading-tight">
                <h2 className="text-lg font-semibold text-gray-900">JuriSync</h2>
                <span className="text-xs text-gray-500">Ecossistema</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {user?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.department || "Sem departamento"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Ações Rápidas
            </h3>
            <div className="space-y-2">
              {quickActions.map((action) => {
                if (
                  action.permission &&
                  !hasPermission(action.permission as any)
                ) {
                  return null;
                }

                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    onClick={action.action}
                    className="w-full justify-start text-left"
                  >
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Navigation */}
          <nav className="flex-1 px-6 py-4 space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Navegação
            </h3>

            {menuItems.map((item) => {
              if (item.permission && !hasPermission(item.permission as any)) {
                return null;
              }

              const isChat = item.label === "Chat";
              return (
                <Button
                  key={item.href}
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left",
                    isActive(item.href) &&
                      "bg-blue-50 text-blue-700 border-blue-200",
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                  {isChat && unreadChat > 0 && (
                    <Badge variant="destructive" className="ml-auto text-[11px]">
                      {unreadChat}
                    </Badge>
                  )}
                  {item.badge && !isChat && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}

            {/* Admin section */}
            {(hasPermission("canManageUsers") || user?.role === "admin") && (
              <>
                <Separator className="my-4" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Administração
                </h3>

                {adminItems.map((item) => {
                  if (
                    item.permission &&
                    !hasPermission(item.permission as any)
                  ) {
                    return null;
                  }

                  return (
                    <Button
                      key={item.href}
                      variant={isActive(item.href) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start text-left",
                        isActive(item.href) &&
                          "bg-blue-50 text-blue-700 border-blue-200",
                      )}
                      onClick={() => handleNavigation(item.href)}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.label}
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>JuriSync v1.0</p>
              <p>© 2024 - Gestão Jurídica</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
