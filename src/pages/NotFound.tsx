import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, FileText, Search } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGoHome = () => {
    // Se o link de confirmacao caiu aqui por algum motivo, redireciona para a tela correta
    if (window.location.pathname.startsWith("/email-confirmed")) {
      navigate("/email-confirmed", { replace: true });
      return;
    }
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardContent className="p-8 text-center space-y-6">
          {/* 404 Icon */}
          <div className="relative">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-12 w-12 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold text-sm">!</span>
            </div>
          </div>

          {/* Error message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">404</h1>
            <h2 className="text-xl font-semibold text-foreground">
              Página não encontrada
            </h2>
            <p className="text-muted-foreground">
              A página que você está procurando não existe ou foi movida.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              {isAuthenticated ? "Ir para Dashboard" : "Fazer Login"}
            </Button>

            <Button variant="outline" onClick={handleGoBack} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>

          {/* Helpful links */}
          {isAuthenticated && (
            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Ou acesse diretamente:
              </p>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/contracts")}
                  className="w-full justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Meus Contratos
                </Button>
              </div>
            </div>
          )}

          {/* JuriSync branding */}
          <div className="pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium">JuriSync</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
