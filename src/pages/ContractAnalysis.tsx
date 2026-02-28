import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Upload, ShieldAlert, Calendar, DollarSign, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type AnalysisResult = {
  name: string;
  summary: string;
  keyDates: { label: string; value: string }[];
  values: { label: string; value: string }[];
  risks: string[];
  clauses: string[];
  recommendations: string[];
};

const mockAnalyze = (file: File): Promise<AnalysisResult> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: file.name,
        summary:
          "Contrato de prestação de serviços com prazo determinado. Não há cláusula de reajuste automático. Previsão de multa por rescisão antecipada.",
        keyDates: [
          { label: "Início", value: "15/03/2026" },
          { label: "Término", value: "15/03/2027" },
          { label: "Revisão", value: "15/02/2027" },
        ],
        values: [
          { label: "Valor total", value: "R$ 180.000,00" },
          { label: "Multa rescisão", value: "10% do saldo" },
          { label: "Reajuste", value: "Não previsto" },
        ],
        risks: [
          "Cláusula de rescisão com multa elevada.",
          "Ausência de SLA detalhado para penalidades.",
          "Prazos de pagamento sem carência.",
        ],
        clauses: [
          "Objeto e escopo dos serviços.",
          "Obrigações das partes.",
          "Rescisão e penalidades.",
          "Confidencialidade e LGPD.",
        ],
        recommendations: [
          "Negociar redução da multa de rescisão.",
          "Incluir SLA com métricas objetivas.",
          "Definir índice de reajuste anual.",
        ],
      });
    }, 1200);
  });

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
      const res = await mockAnalyze(file);
      setResult(res);
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

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Datas-chave
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.keyDates.map((d) => (
                    <div key={d.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{d.label}</span>
                      <span className="font-medium">{d.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Valores e condições
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.values.map((v) => (
                    <div key={v.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{v.label}</span>
                      <span className="font-medium">{v.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cláusulas relevantes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.clauses.map((c) => (
                    <Badge key={c} variant="secondary">
                      {c}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            </div>
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
