import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Upload, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";

type AnalysisResult = {
  name: string;
  summary: string;
  risks: string[];
  recommendations: string[];
};

const normalizeText = (value: string) =>
  value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[-•]\s*/, "")
    .trim();

const parseAnalysis = (data: any): AnalysisResult => {
  let payload: any = data;
  if (typeof data === "string") {
    try {
      payload = JSON.parse(data);
    } catch {
      payload = { summary: data };
    }
  }

  // Se vier "summary" contendo um JSON stringificado
  if (typeof payload?.summary === "string") {
    const trimmed = payload.summary.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        payload = { ...parsed, name: payload.name || parsed.name };
      } catch {
        // ignore
      }
    }
  }

  const risksRaw = Array.isArray(payload?.risks) ? payload.risks : [];
  const recsRaw = Array.isArray(payload?.recommendations) ? payload.recommendations : [];

  return {
    name: payload?.name || "Contrato",
    summary: normalizeText(payload?.summary || "Análise indisponível."),
    risks: risksRaw.map((r: any) => normalizeText(String(r))).filter(Boolean),
    recommendations: recsRaw.map((r: any) => normalizeText(String(r))).filter(Boolean),
  };
};

export default function ContractAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error("Selecione um arquivo de contrato.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("jurisync_token");
      const res = await fetch(`${API_URL}/api/contract-analysis`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Falha ao analisar contrato");
      }
      const data = await res.json();
      const parsed = parseAnalysis({ ...data, name: file.name });
      setResult(parsed);
      toast.success("Análise concluída.");
    } catch (err: any) {
      toast.error(err?.message || "Falha ao analisar contrato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Análise de Contratos</h1>
          <p className="text-sm text-gray-500">
            Envie um contrato para receber um resumo e alertas.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload do contrato
            </CardTitle>
            <CardDescription>
              Formatos aceitos: PDF, DOC ou DOCX.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
            <div className="flex items-center gap-2">
              <Button onClick={handleAnalyze} disabled={loading}>
                {loading ? "Analisando..." : "Analisar contrato"}
              </Button>
              {file && (
                <Badge variant="outline" className="truncate">
                  {file.name}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Resumo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{result.summary}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    Riscos Identificados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.risks.map((r) => (
                    <div key={r} className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      {r}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Recomendações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.recommendations.map((r) => (
                    <div key={r} className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {r}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6" />
          </div>
        )}

        {!result && (
          <div className="text-sm text-gray-500">
            Faça o upload de um contrato para gerar a análise.
          </div>
        )}
      </div>
    </Layout>
  );
}
