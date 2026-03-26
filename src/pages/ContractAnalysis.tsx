import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    .replace(/```json|```/gi, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[-*•]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

const extractJsonPayload = (raw: string) => {
  const clean = raw.trim();
  if (!clean) return clean;
  if (clean.startsWith("{") && clean.endsWith("}")) return clean;

  const fenced =
    clean.match(/```json\s*([\s\S]*?)```/i) ||
    clean.match(/```\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return clean.slice(start, end + 1).trim();
  }
  return clean;
};

const firstSentence = (value: string) => {
  const m = value.match(/^(.+?[.!?])(\s|$)/);
  return m ? m[1].trim() : value.trim();
};

const simplifyPoint = (value: string) => {
  const clean = normalizeText(value);
  if (!clean) return "";

  const colonIdx = clean.indexOf(":");
  if (colonIdx > 0) {
    const head = clean.slice(0, colonIdx).trim();
    const tail = clean.slice(colonIdx + 1).trim();
    const shortTail = tail.length > 260 ? firstSentence(tail) : tail;
    return shortTail ? `${head}: ${shortTail}` : head;
  }

  return clean.length > 260 ? firstSentence(clean) : clean;
};

const parseAnalysis = (data: unknown): AnalysisResult => {
  let payload: any = data;

  if (typeof payload === "string") {
    try {
      payload = JSON.parse(extractJsonPayload(payload));
    } catch {
      payload = { summary: normalizeText(payload) };
    }
  }

  if (typeof payload?.summary === "string") {
    const maybeJson = extractJsonPayload(payload.summary);
    if (maybeJson.startsWith("{") && maybeJson.endsWith("}")) {
      try {
        const parsed = JSON.parse(maybeJson);
        payload = { ...parsed, name: payload?.name || parsed?.name };
      } catch {
        // keep current payload
      }
    }
  }

  const risksRaw = Array.isArray(payload?.risks) ? payload.risks : [];
  const recommendationsRaw = Array.isArray(payload?.recommendations)
    ? payload.recommendations
    : [];

  return {
    name: payload?.name || "Contrato",
    summary: normalizeText(payload?.summary || "Analise indisponivel."),
    risks: risksRaw.map((item: unknown) => simplifyPoint(String(item))).filter(Boolean),
    recommendations: recommendationsRaw
      .map((item: unknown) => simplifyPoint(String(item)))
      .filter(Boolean),
  };
};

export default function ContractAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
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
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Falha ao analisar contrato");
      }

      const data = await res.json();
      setResult(parseAnalysis({ ...data, name: file.name }));
      toast.success("Analise concluida.");
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
          <h1 className="text-2xl font-semibold text-gray-900">Analise de Contratos</h1>
          <p className="text-sm text-gray-500">Envie um contrato para receber resumo, riscos e recomendacoes.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload do contrato
            </CardTitle>
            <CardDescription>Formatos aceitos: PDF e DOCX.</CardDescription>
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
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resumo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-6">{result.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  Riscos Identificados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.risks.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum risco identificado.</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                    {result.risks.map((risk, idx) => (
                      <li key={`${idx}-${risk.slice(0, 40)}`}>{risk}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Recomendacoes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.recommendations.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma recomendacao encontrada.</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                    {result.recommendations.map((item, idx) => (
                      <li key={`${idx}-${item.slice(0, 40)}`}>{item}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!result && <div className="text-sm text-gray-500">Faca o upload para gerar a analise.</div>}
      </div>
    </Layout>
  );
}
