import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoginCredentials } from "@/types/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Users,
  BarChart3,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!credentials.email) newErrors.email = "E-mail é obrigatório";
    if (!credentials.password) newErrors.password = "Senha é obrigatória";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const success = await login(credentials);
    if (success) {
      navigate("/dashboard");
    }
  };

  const handleDemoLogin = (role: "admin" | "manager" | "user") => {
    const demoCredentials = {
      admin: { email: "admin@jurisync.com", password: "admin123" },
      manager: { email: "joao@jurisync.com", password: "joao123" },
      user: { email: "maria@jurisync.com", password: "maria123" },
    };

    setCredentials(demoCredentials[role]);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding and Features */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <img
              src="/logos/svg/jurisync-horizontal.svg"
              alt="JuriSync"
              className="h-10 w-auto"
            />
            <p className="text-muted-foreground">Gestão Jurídica Inteligente</p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Gerencie seus contratos com total controle
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Segurança total
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Controle de acesso por níveis e criptografia de dados
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Trabalho em equipe
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Colaboração em tempo real com sistema de permissões
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Analytics avançado
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Dashboards e relatórios para tomada de decisão
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="border border-border shadow-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-center">
                Entrar no JuriSync
              </CardTitle>
              <CardDescription className="text-center">
                Digite suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={credentials.email}
                      onChange={(e) =>
                        setCredentials((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={credentials.password}
                      onChange={(e) =>
                        setCredentials((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">
                    Ou teste com demo
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Acesso rápido para demonstração:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin("admin")}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    👑 Administrador
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin("manager")}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    👔 Gerente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin("user")}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    👤 Usuário
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Não tem uma conta?{" "}
                  <Link
                    to="/register"
                    className="text-primary hover:underline font-medium"
                  >
                    Cadastre-se
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Demo credentials info */}
          <Alert className="mt-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Credenciais de demonstração:</strong>
              <br />
              Admin: admin@jurisync.com / admin123
              <br />
              Gerente: joao@jurisync.com / joao123
              <br />
              Usuário: maria@jurisync.com / maria123
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
