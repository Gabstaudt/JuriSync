import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Bell,
  Download,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { settingsService } from "@/lib/services/settings";

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: {
      emailEnabled: true,
      contractExpiry: true,
      weeklyReport: true,
      commentNotifications: true,
      daysBeforeExpiry: 7,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await settingsService.get();
        if (!mounted) return;
        if (data?.notifications) {
          setSettings({ notifications: data.notifications });
        }
      } catch (err: any) {
        if (mounted) toast.error(err?.message || "Erro ao carregar configuracoes");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveSettings = async () => {
    try {
      await settingsService.update(settings);
      toast.success("Configurações salvas com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar configuracoes");
    }
  };

  const handleResetSettings = async () => {
    const defaults = {
      notifications: {
        emailEnabled: true,
        contractExpiry: true,
        weeklyReport: true,
        commentNotifications: true,
        daysBeforeExpiry: 7,
      },
    };
    setSettings(defaults);
    try {
      await settingsService.update(defaults);
      toast.success("Configurações resetadas para o padrão");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao resetar configuracoes");
    }
  };

  const handleExportData = async () => {
    try {
      const { blob, filename } = await settingsService.exportData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Exportação de dados concluída.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao exportar dados");
    }
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
            <Button variant="outline" onClick={handleResetSettings} disabled={loading}>
              Resetar
            </Button>
            <Button onClick={handleSaveSettings} disabled={loading}>
              <Check className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="privacy">Privacidade</TabsTrigger>
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

          {/* Privacy */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Dados</CardTitle>
                <CardDescription>Exporte seus dados do sistema</CardDescription>
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

        </Tabs>
      </div>
    </Layout>
  );
}

