import { useState, useCallback, useRef } from "react";
import { Contract } from "@/types/contract";
import { parseContractFile } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface ContractImportProps {
  onContractParsed: (contractData: Partial<Contract>, file: File) => void;
  onClose: () => void;
}

interface FileUpload {
  file: File;
  status: "uploading" | "parsing" | "completed" | "error";
  progress: number;
  parsedData?: Partial<Contract>;
  error?: string;
}

export function ContractImport({
  onContractParsed,
  onClose,
}: ContractImportProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter((file) => {
        const isValidType =
          file.type === "application/pdf" ||
          file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

        if (!isValidType) {
          toast.error(`Arquivo "${file.name}" não é um PDF ou DOCX válido`);
          return false;
        }
        if (!isValidSize) {
          toast.error(`Arquivo "${file.name}" é muito grande (máx. 10MB)`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      const newUploads: FileUpload[] = validFiles.map((file) => ({
        file,
        status: "uploading",
        progress: 0,
      }));

      setUploads((prev) => [...prev, ...newUploads]);
      setIsProcessing(true);

      for (let i = 0; i < newUploads.length; i++) {
        const upload = newUploads[i];

        try {
          // Simulate upload progress
          setUploads((prev) =>
            prev.map((u) =>
              u.file === upload.file
                ? { ...u, status: "uploading", progress: 30 }
                : u,
            ),
          );

          await new Promise((resolve) => setTimeout(resolve, 500));

          // Start parsing
          setUploads((prev) =>
            prev.map((u) =>
              u.file === upload.file
                ? { ...u, status: "parsing", progress: 60 }
                : u,
            ),
          );

          // Parse the contract
          const parsedData = await parseContractFile(upload.file);

          // Complete
          setUploads((prev) =>
            prev.map((u) =>
              u.file === upload.file
                ? { ...u, status: "completed", progress: 100, parsedData }
                : u,
            ),
          );

          onContractParsed(parsedData, upload.file);
          toast.success(
            `Contrato "${upload.file.name}" processado com sucesso!`,
          );
        } catch (error) {
          setUploads((prev) =>
            prev.map((u) =>
              u.file === upload.file
                ? {
                    ...u,
                    status: "error",
                    progress: 0,
                    error:
                      error instanceof Error
                        ? error.message
                        : "Erro desconhecido",
                  }
                : u,
            ),
          );
          toast.error(`Erro ao processar "${upload.file.name}"`);
        }
      }

      setIsProcessing(false);
    },
    [onContractParsed],
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragActive(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeUpload = (fileToRemove: File) => {
    setUploads((prev) => prev.filter((u) => u.file !== fileToRemove));
  };

  const getStatusIcon = (status: FileUpload["status"]) => {
    switch (status) {
      case "uploading":
      case "parsing":
        return <Upload className="h-4 w-4 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusText = (upload: FileUpload) => {
    switch (upload.status) {
      case "uploading":
        return "Enviando arquivo...";
      case "parsing":
        return "Analisando contrato...";
      case "completed":
        return "Processado com sucesso";
      case "error":
        return upload.error || "Erro no processamento";
      default:
        return "";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto max-h-[80vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importar Contratos
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }
          `}
        >
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-muted rounded-full">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium">
                {isDragActive
                  ? "Solte os arquivos aqui..."
                  : "Arraste contratos ou clique para selecionar"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Suporta arquivos PDF e DOCX (máx. 10MB cada)
              </p>
            </div>
          </div>
        </div>

        {/* Upload List */}
        {uploads.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Arquivos em Processamento</h3>
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
              {uploads.map((upload, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(upload.status)}
                      <div>
                        <p className="font-medium text-sm">
                          {upload.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUpload(upload.file)}
                      disabled={
                        upload.status === "parsing" ||
                        upload.status === "uploading"
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {(upload.status === "uploading" ||
                    upload.status === "parsing") && (
                    <div className="space-y-2">
                      <Progress value={upload.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {getStatusText(upload)}
                      </p>
                    </div>
                  )}

                  {upload.status === "completed" && upload.parsedData && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800 font-medium mb-2">
                        ✅ Dados extraídos com sucesso:
                      </p>
                      <div className="text-xs text-green-700 space-y-1">
                        <p>
                          <strong>Nome:</strong> {upload.parsedData.name}
                        </p>
                        <p>
                          <strong>Empresa:</strong>{" "}
                          {upload.parsedData.contractingCompany}
                        </p>
                        <p>
                          <strong>Valor:</strong>{" "}
                          {upload.parsedData.value
                            ? new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(upload.parsedData.value)
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  )}

                  {upload.status === "error" && (
                    <Alert className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{upload.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>Como funciona:</strong> O sistema analisa automaticamente
            seus contratos em PDF ou DOCX e extrai informações como nome,
            empresas, datas, valores e responsáveis. Após a análise, você pode
            revisar e editar os dados antes de salvar.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
