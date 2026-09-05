import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoginCredentials } from "@/types/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

const highlights = [
  {
    title: "Segurança total",
    description: "Controle de acesso por níveis e criptografia de dados",
  },
  {
    title: "Trabalho em equipe",
    description: "Colaboração em tempo real com sistema de permissões",
  },
  {
    title: "Analytics avançado",
    description: "Dashboards e relatórios para tomada de decisão",
  },
];

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

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-5 bg-background">
      {/* Left side — brand panel */}
      <div className="hidden lg:flex lg:col-span-2 flex-col justify-between bg-primary text-primary-foreground px-12 py-14 xl:px-16">
        <img
          src="/logos/svg/jurisync-horizontal-branco.svg"
          alt="JuriSync"
          className="h-8 w-auto"
        />

        <div className="max-w-sm space-y-10">
          <h1 className="text-3xl font-semibold leading-snug">
            Gerencie seus contratos com total controle
          </h1>

          <div>
            {highlights.map((item, i) => (
              <div
                key={item.title}
                className={`py-5 ${i > 0 ? "border-t border-primary-foreground/15" : ""}`}
              >
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-primary-foreground/70 mt-1">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-primary-foreground/50">
          © 2026 JuriSync — Gestão Jurídica
        </p>
      </div>

      {/* Right side — login form */}
      <div className="lg:col-span-3 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <img
            src="/logos/svg/jurisync-horizontal.svg"
            alt="JuriSync"
            className="h-7 w-auto mb-10 lg:hidden"
          />

          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-foreground">
              Entrar no JuriSync
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Digite suas credenciais para acessar o sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                  className={`pl-6 pr-0 rounded-none border-0 border-b bg-transparent focus-visible:ring-0 focus-visible:border-primary ${
                    errors.email ? "border-destructive" : "border-border"
                  }`}
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
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                  className={`pl-6 pr-8 rounded-none border-0 border-b bg-transparent focus-visible:ring-0 focus-visible:border-primary ${
                    errors.password ? "border-destructive" : "border-border"
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isLoading}
            >
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

          <p className="text-sm text-muted-foreground text-center mt-8">
            Não tem uma conta?{" "}
            <Link
              to="/register"
              className="text-primary hover:underline font-medium"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
