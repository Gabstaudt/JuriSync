import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CreateFolderData, folderColors, folderIcons } from "@/types/folder";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  FolderOpen,
  Palette,
  Star,
  Archive,
  Building,
  Briefcase,
  Shield,
  Scale,
  FileText,
  Users,
  Settings,
  Heart,
  Lock,
  Globe,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export default function NewFolder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateFolderData>({
    name: "",
    description: "",
    color: folderColors[0],
    icon: folderIcons[0],
    type: "custom",
    permissions: {
      canView: [],
      canEdit: [],
      canManage: [],
      isPublic: true,
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      FolderOpen,
      Archive,
      Building,
      Briefcase,
      Shield,
      Scale,
      FileText,
      Users,
      Settings,
      Star,
      Heart,
      Lock,
      Globe,
      Zap,
    };
    return icons[iconName] || FolderOpen;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Nome da pasta é obrigatório";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create folder object
      const newFolder = {
        id: crypto.randomUUID(),
        ...formData,
        path: [],
        createdBy: user?.id || "",
        createdAt: new Date(),
        updatedAt: new Date(),
        contractCount: 0,
        isActive: true,
      };

      // Save to localStorage
      const existingFolders = JSON.parse(
        localStorage.getItem("jurisync_folders") || "[]",
      );
      const updatedFolders = [...existingFolders, newFolder];
      localStorage.setItem("jurisync_folders", JSON.stringify(updatedFolders));

      toast.success("Pasta criada com sucesso!");
      navigate("/folders");
    } catch (error) {
      toast.error("Erro ao criar pasta");
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof CreateFolderData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/folders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nova Pasta</h1>
            <p className="text-gray-600 mt-1">
              Crie uma nova pasta para organizar seus contratos
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Informações da Pasta
              </CardTitle>
              <CardDescription>
                Defina o nome e descrição da pasta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Pasta *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Contratos Comerciais"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descrição opcional da pasta"
                  value={formData.description}
                  onChange={(e) =>
                    updateFormData("description", e.target.value)
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Aparência
              </CardTitle>
              <CardDescription>
                Personalize a cor e ícone da pasta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview */}
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: formData.color }}
                >
                  {(() => {
                    const IconComponent = getIconComponent(formData.icon);
                    return <IconComponent className="h-6 w-6" />;
                  })()}
                </div>
                <div>
                  <h3 className="font-medium">
                    {formData.name || "Nome da Pasta"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.description || "Descrição da pasta"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => updateFormData("color", value)}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: formData.color }}
                          />
                          Cor
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {folderColors.map((color) => (
                        <SelectItem key={color} value={color}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: color }}
                            />
                            {color}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => updateFormData("icon", value)}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const IconComponent = getIconComponent(
                              formData.icon,
                            );
                            return <IconComponent className="h-4 w-4" />;
                          })()}
                          {formData.icon}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {folderIcons.map((icon) => {
                        const IconComponent = getIconComponent(icon);
                        return (
                          <SelectItem key={icon} value={icon}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {icon}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/folders")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                  Criando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Criar Pasta
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
