import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { RegisterData, UserRole } from "@/types/auth";
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
import {
  FileText,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  User,
  Building,
  Phone,
  Key,
  ArrowLeft,
  Shield,
} from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    role: "user",
    accessCode: "",
    ecosystemName: "",
    department: "",
    phone: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);

  // Se trocar de perfil para não-admin, desmarca "primeiro admin"
  useEffect(() => {
    if (formData.role !== "admin" && isFirstAdmin) {
      setIsFirstAdmin(false);
    }
  }, [formData.role, isFirstAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!formData.email.trim()) newErrors.email = "E-mail é obrigatório";
    if (!formData.password) newErrors.password = "Senha é obrigatória";
    if (formData.password.length < 6)
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    if (formData.password !== confirmPassword)
      newErrors.confirmPassword = "Senhas não coincidem";

    // access code required for todos, exceto primeiro admin
    const isFirstAdminFlow = isFirstAdmin && formData.role === "admin";
    const requiresCode = !isFirstAdminFlow;
    if (requiresCode && !formData.accessCode?.trim()) {
      newErrors.accessCode = "Código de acesso é obrigatório";
    }
    if (isFirstAdminFlow && !formData.ecosystemName.trim()) {
      newErrors.ecosystemName = "Nome do ecossistema é obrigatório para o primeiro admin";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: RegisterData = {
      ...formData,
      accessCode: requiresCode ? formData.accessCode : "",
    };

    const success = await register({ ...payload, isFirstAdmin: isFirstAdminFlow });
    if (success) {
      navigate("/dashboard");
    }
  };

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Login
          </Button>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="h-7 w-7 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              Criar Conta no JuriSync
            </CardTitle>
            <CardDescription className="text-center">
              Escolha seu perfil e use o código de acesso do seu ecossistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <div className="relative">
                    <Input
                      id="name"
                      placeholder="Digite seu nome"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                    <User className="h-4 w-4 text-gray-400 absolute right-3 top-3" />
                  </div>
                  {errors.name && (
                    <Alert variant="destructive">
                      <AlertDescription>{errors.name}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                    <Mail className="h-4 w-4 text-gray-400 absolute right-3 top-3" />
                  </div>
                  {errors.email && (
                    <Alert variant="destructive">
                      <AlertDescription>{errors.email}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <Lock className="h-4 w-4 text-gray-400 absolute right-10 top-3" />
                  </div>
                  {errors.password && (
                    <Alert variant="destructive">
                      <AlertDescription>{errors.password}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <Lock className="h-4 w-4 text-gray-400 absolute right-10 top-3" />
                  </div>
                  {errors.confirmPassword && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {errors.confirmPassword}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Perfil *</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={formData.role}
                    onChange={(e) =>
                      handleInputChange("role", e.target.value as UserRole)
                    }
                  >
                    <option value="admin">Administrador</option>
                    <option value="manager">Gerente</option>
                    <option value="user">Usuário</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessCode">Código de Acesso *</Label>
                  <div className="relative">
                    <Input
                      id="accessCode"
                      placeholder="Digite o código fornecido"
                      value={formData.accessCode}
                      onChange={(e) =>
                        handleInputChange("accessCode", e.target.value)
                      }
                      disabled={isFirstAdmin && formData.role === "admin"}
                    />
                    <Key className="h-4 w-4 text-gray-400 absolute right-3 top-3" />
                  </div>
                  {errors.accessCode && (
                    <Alert variant="destructive">
                      <AlertDescription>{errors.accessCode}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={isFirstAdmin && formData.role === "admin"}
                      onChange={(e) => {
                        if (formData.role !== "admin") return;
                        setIsFirstAdmin(e.target.checked);
                        if (e.target.checked) {
                          setFormData((prev) => ({ ...prev, accessCode: "" }));
                        }
                      }}
                    />
                    <span>Sou o primeiro administrador (sem código)</span>
                  </div>
                </div>
              </div>

              {isFirstAdmin && formData.role === "admin" && (
                <div className="space-y-2">
                  <Label htmlFor="ecosystemName">Nome do Ecossistema *</Label>
                  <div className="relative">
                    <Input
                      id="ecosystemName"
                      placeholder="Ex.: Ecosystem Jurídico"
                      value={formData.ecosystemName}
                      onChange={(e) =>
                        handleInputChange("ecosystemName", e.target.value)
                      }
                    />
                    <Shield className="h-4 w-4 text-gray-400 absolute right-3 top-3" />
                  </div>
                  {errors.ecosystemName && (
                    <Alert variant="destructive">
                      <AlertDescription>{errors.ecosystemName}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <div className="relative">
                    <Input
                      id="department"
                      placeholder="Jurídico, Operações..."
                      value={formData.department}
                      onChange={(e) =>
                        handleInputChange("department", e.target.value)
                      }
                    />
                    <Building className="h-4 w-4 text-gray-400 absolute right-3 top-3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      placeholder="(99) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                    <Phone className="h-4 w-4 text-gray-400 absolute right-3 top-3" />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando conta...
                  </div>
                ) : (
                  "Criar Conta"
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Já tem uma conta?{" "}
                <Link to="/login" className="text-blue-600 hover:text-blue-800">
                  Acesse aqui
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
