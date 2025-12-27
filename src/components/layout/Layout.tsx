import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/services/auth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, refreshUser } = useAuth();
  const [resending, setResending] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [code, setCode] = useState("");

  // Detecta query params de confirmação (quando APP_URL recebe redirect ?emailConfirmed=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("emailConfirmed") === "1") {
      setJustConfirmed(true);
      setShowConfirmModal(true);
      params.delete("emailConfirmed");
      params.delete("message");
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", newUrl);
      refreshUser();
    }
  }, [refreshUser]);

  const handleResend = async () => {
    try {
      setResending(true);
      await authService.resendConfirmation();
      toast.success("Email de confirmacao reenviado");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao reenviar");
    } finally {
      setResending(false);
    }
  };

  const handleConfirmCode = async () => {
    if (!code.trim()) {
      toast.error("Informe o código enviado ao email");
      return;
    }
    try {
      setConfirming(true);
      await authService.confirmCode(code.trim());
      setJustConfirmed(true);
      setShowConfirmModal(true);
      setCode("");
      await refreshUser();
    } catch (e: any) {
      toast.error(e?.message || "Código inválido");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {user && !user.emailVerified && !justConfirmed && (
        <div className="bg-amber-50 border-b border-amber-200 lg:ml-64 transition-all">
          <div className="px-4 py-3">
            <Alert className="bg-transparent border-none p-0">
              <AlertTitle className="text-amber-800">
                Confirme seu email para liberar todas as funcionalidades.
              </AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-3 text-amber-800">
                <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:items-center">
                  <input
                    type="text"
                    placeholder="Código de 6 dígitos"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="border rounded-md px-3 py-2 text-sm w-full md:w-48"
                  />
                  <Button size="sm" onClick={handleConfirmCode} disabled={confirming}>
                    {confirming ? "Confirmando..." : "Confirmar código"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleResend} disabled={resending}>
                    {resending ? "Enviando..." : "Reenviar email"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={refreshUser}>
                    Já confirmei
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seu email foi confirmado</DialogTitle>
            <DialogDescription>
              Obrigado por confirmar. Agora você tem acesso completo à plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowConfirmModal(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          "lg:ml-64", // Sidebar width on desktop
        )}
      >
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
