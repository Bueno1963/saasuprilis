import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, FileText, Shield, Search, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ResultData {
  patient: { name: string; cpf_masked: string };
  order: { order_number: string; doctor_name: string; created_at: string };
  results: Array<{
    id: string;
    exam: string;
    value: string;
    unit: string;
    reference_range: string;
    flag: string;
    released_at: string;
  }>;
  lab: { name: string; phone: string; address: string; city: string; state: string; technical_responsible: string; crm_responsible: string } | null;
}

const PortalPaciente = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ResultData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !birthDate) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("portal-patient-access", {
        body: { order_number: orderNumber.trim(), birth_date: birthDate },
      });

      if (fnError) throw fnError;
      if (result?.error) {
        setError(result.error);
      } else {
        setData(result);
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao consultar resultados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getFlagColor = (flag: string) => {
    if (flag === "high" || flag === "critical_high") return "text-red-600 bg-red-50";
    if (flag === "low" || flag === "critical_low") return "text-blue-600 bg-blue-50";
    return "text-emerald-700 bg-emerald-50";
  };

  const getFlagLabel = (flag: string) => {
    const map: Record<string, string> = {
      normal: "Normal",
      high: "Alto",
      low: "Baixo",
      critical_high: "Crítico Alto",
      critical_low: "Crítico Baixo",
    };
    return map[flag] || flag;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Portal do Paciente</h1>
            <p className="text-xs text-muted-foreground">Consulte seus resultados de forma segura</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>Acesso seguro</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!data ? (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Consultar Resultados</h2>
              <p className="text-sm text-muted-foreground">
                Informe o número do pedido e sua data de nascimento para acessar seus exames.
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="order">Número do Pedido</Label>
                    <Input
                      id="order"
                      placeholder="Ex: ORD-2026-001"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthdate">Data de Nascimento</Label>
                    <Input
                      id="birthdate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Consultando...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Consultar Resultados
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Seus dados são protegidos conforme a LGPD
              </p>
              <p className="text-xs text-muted-foreground">
                Todo acesso é registrado para sua segurança
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Lab info */}
            {data.lab && (
              <div className="text-center border-b border-slate-200 pb-4">
                <h2 className="text-lg font-bold text-foreground">{data.lab.name || "Laboratório"}</h2>
                {data.lab.address && (
                  <p className="text-xs text-muted-foreground">
                    {data.lab.address}{data.lab.city ? `, ${data.lab.city}` : ""}{data.lab.state ? ` - ${data.lab.state}` : ""}
                  </p>
                )}
                {data.lab.phone && <p className="text-xs text-muted-foreground">Tel: {data.lab.phone}</p>}
              </div>
            )}

            {/* Patient + Order info */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Paciente:</span>
                    <p className="font-medium">{data.patient.name}</p>
                    <p className="text-xs text-muted-foreground">CPF: {data.patient.cpf_masked}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pedido:</span>
                    <p className="font-medium">{data.order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Dr(a). {data.order.doctor_name} • {new Date(data.order.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Resultados Liberados ({data.results.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.results.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm">{result.exam}</p>
                        <p className="text-xs text-muted-foreground">
                          Ref: {result.reference_range || "—"} {result.unit && `(${result.unit})`}
                        </p>
                        {result.released_at && (
                          <p className="text-[10px] text-muted-foreground">
                            Liberado em {new Date(result.released_at).toLocaleString("pt-BR")}
                          </p>
                        )}
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-semibold text-sm">{result.value} {result.unit}</p>
                        <Badge variant="outline" className={cn("text-[10px]", getFlagColor(result.flag))}>
                          {getFlagLabel(result.flag)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center space-y-2 pt-4 border-t border-slate-200">
              {data.lab && (
                <p className="text-xs text-muted-foreground">
                  Resp. Técnico: {data.lab.technical_responsible} — CRM {data.lab.crm_responsible}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground">
                Este documento é uma visualização digital. Acesso registrado para fins de auditoria (LGPD).
              </p>
              <Button variant="outline" size="sm" onClick={() => { setData(null); setOrderNumber(""); setBirthDate(""); }}>
                Nova Consulta
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalPaciente;
