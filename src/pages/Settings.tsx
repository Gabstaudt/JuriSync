import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings as SettingsIcon,
  Bell,
  Mail,
  Shield,
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Check,
  Clock,
  Globe,
  Lock,
  Eye,
  Smartphone,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user, hasPermission } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      emailEnabled: true,
      contractExpiry: true,
      weeklyReport: true,
      commentNotifications: true,
      daysBeforeExpiry: 7,
    },
    display: {
      theme: "light",
      language: "pt-BR",
      timezone: "America/Sao_Paulo",
      dateFormat: "DD/MM/YYYY",
    },
    privacy: {
      profileVisibility: "team",
      activityTracking: true,
      dataSharing: false,
    },
    system: {
      autoBackup: true,
      backupFrequency: "weekly",
      dataRetention: "2years",
    },
  });

  const handleSaveSettings = () => {
    // In production, this would save to backend
    localStorage.setItem("jurisync_settings", JSON.stringify(settings));
    toast.success("Configurações salvas com sucesso!");
  };

  const handleResetSettings = () => {
    // Reset to default settings
    setSettings({
      notifications: {
        emailEnabled: true,
        contractExpiry: true,
        weeklyReport: true,
        commentNotifications: true,
        daysBeforeExpiry: 7,
      },
      display: {
        theme: "light",
        language: "pt-BR",
        timezone: "America/Sao_Paulo",
        dateFormat: "DD/MM/YYYY",
      },
      privacy: {
        profileVisibility: "team",
        activityTracking: true,
        dataSharing: false,
      },
      system: {
        autoBackup: true,
        backupFrequency: "weekly",
        dataRetention: "2years",
      },
    });
    toast.success("Configurações resetadas para o padrão");
  };

  const handleExportData = () => {
    // Simulate data export
    toast.success(
      "Exportação de dados iniciada. Você receberá um e-mail quando estiver pronta.",
    );
  };

  const handleImportData = () => {
    // Simulate data import
    toast.info("Funcionalidade de importação em desenvolvimento");
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value,
      },
    }));
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
            <p className="text-gray-600 mt-1">
              Gerencie as configurações do sistema e suas preferências
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetSettings}>
              Resetar
            </Button>
            <Button onClick={handleSaveSettings}>
              <Check className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="display">Exibição</TabsTrigger>
            <TabsTrigger value="privacy">Privacidade</TabsTrigger>
            {user?.role === "admin" && (
              <TabsTrigger value="system">Sistema</TabsTrigger>
            )}
          </TabsList>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações por E-mail
                </CardTitle>
                <CardDescription>
                  Configure quando e como receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">Ativar E-mails</h4>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações por e-mail
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "emailEnabled", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">Vencimento de Contratos</h4>
                    <p className="text-sm text-muted-foreground">
                      Alertas quando contratos estão próximos do vencimento
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.contractExpiry}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "contractExpiry", checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="daysBeforeExpiry">
                    Dias antes do vencimento
                  </Label>
                  <Select
                    value={settings.notifications.daysBeforeExpiry.toString()}
                    onValueChange={(value) =>
                      updateSetting(
                        "notifications",
                        "daysBeforeExpiry",
                        parseInt(value),
                      )
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 dia</SelectItem>
                      <SelectItem value="3">3 dias</SelectItem>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="15">15 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">Relatório Semanal</h4>
                    <p className="text-sm text-muted-foreground">
                      Resumo semanal das atividades do sistema
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.weeklyReport}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "weeklyReport", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">Comentários em Contratos</h4>
                    <p className="text-sm text-muted-foreground">
                      Notificações quando alguém comenta em seus contratos
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.commentNotifications}
                    onCheckedChange={(checked) =>
                      updateSetting(
                        "notifications",
                        "commentNotifications",
                        checked,
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display */}
          <TabsContent value="display" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Preferências de Exibição
                </CardTitle>
                <CardDescription>
                  Personalize a aparência do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Tema</Label>
                    <Select
                      value={settings.display.theme}
                      onValueChange={(value) =>
                        updateSetting("display", "theme", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select
                      value={settings.display.language}
                      onValueChange={(value) =>
                        updateSetting("display", "language", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">
                          Português (Brasil)
                        </SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select
                      value={settings.display.timezone}
                      onValueChange={(value) =>
                        updateSetting("display", "timezone", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">
                          São Paulo (UTC-3)
                        </SelectItem>
                        <SelectItem value="America/New_York">
                          New York (UTC-5)
                        </SelectItem>
                        <SelectItem value="Europe/London">
                          London (UTC+0)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Formato de Data</Label>
                    <Select
                      value={settings.display.dateFormat}
                      onValueChange={(value) =>
                        updateSetting("display", "dateFormat", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacidade e Segurança
                </CardTitle>
                <CardDescription>
                  Controle como seus dados são utilizados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="profileVisibility">
                    Visibilidade do Perfil
                  </Label>
                  <Select
                    value={settings.privacy.profileVisibility}
                    onValueChange={(value) =>
                      updateSetting("privacy", "profileVisibility", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Público</SelectItem>
                      <SelectItem value="team">Apenas Equipe</SelectItem>
                      <SelectItem value="private">Privado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">Rastreamento de Atividades</h4>
                    <p className="text-sm text-muted-foreground">
                      Permitir que o sistema registre suas atividades para
                      analytics
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.activityTracking}
                    onCheckedChange={(checked) =>
                      updateSetting("privacy", "activityTracking", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">Compartilhamento de Dados</h4>
                    <p className="text-sm text-muted-foreground">
                      Compartilhar dados anônimos para melhoria do produto
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.dataSharing}
                    onCheckedChange={(checked) =>
                      updateSetting("privacy", "dataSharing", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Dados</CardTitle>
                <CardDescription>Exporte ou remova seus dados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">Exportar Dados</h4>
                    <p className="text-sm text-muted-foreground">
                      Baixe uma cópia de todos os seus dados
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System (Admin only) */}
          {user?.role === "admin" && (
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Configurações do Sistema
                  </CardTitle>
                  <CardDescription>
                    Configurações globais do sistema (apenas administradores)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">Backup Automático</h4>
                      <p className="text-sm text-muted-foreground">
                        Realizar backup automático dos dados
                      </p>
                    </div>
                    <Switch
                      checked={settings.system.autoBackup}
                      onCheckedChange={(checked) =>
                        updateSetting("system", "autoBackup", checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">
                      Frequência do Backup
                    </Label>
                    <Select
                      value={settings.system.backupFrequency}
                      onValueChange={(value) =>
                        updateSetting("system", "backupFrequency", value)
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataRetention">Retenção de Dados</Label>
                    <Select
                      value={settings.system.dataRetention}
                      onValueChange={(value) =>
                        updateSetting("system", "dataRetention", value)
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1year">1 ano</SelectItem>
                        <SelectItem value="2years">2 anos</SelectItem>
                        <SelectItem value="5years">5 anos</SelectItem>
                        <SelectItem value="forever">Indefinidamente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium text-red-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Zona de Perigo
                    </h4>

                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="space-y-1">
                        <h5 className="font-medium text-red-800">
                          Importar Dados
                        </h5>
                        <p className="text-sm text-red-600">
                          Substituir dados existentes por um backup
                        </p>
                      </div>
                      <Button variant="destructive" onClick={handleImportData}>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
