import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Activity, Stethoscope, Shield, Search, AlertCircle, CheckCircle, Loader2, User, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface OrderResult {
  order_number: string;
  created_at: string;
  patient_name: string;
  results: Array<{
    id: string;
    exam: string;
    value: string;
    unit: string;
    reference_range: string;
    flag: string;
    released_at: string;
  }>;
}

interface DoctorData {
  doctor_name: string;
  crm: string;
  orders: OrderResult[];
  lab: { name: string; phone: string } | null;
}

const PortalMedico = () => {
  const [crm, setCrm] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<DoctorData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crm.trim() || !doctorName.trim()) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("portal-doctor-access", {
        body: { crm: crm.trim(), doctor_name: doctorName.trim() },
      });

      if (fnError) throw fnError;
      if (result?.error) {
        setError(result.error);
      } else {
        setData(result);
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao consultar resultados.");
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
    const map: Record<string, string> = { normal: "Normal", high: "Alto", low: "Baixo", critical_high: "Crítico Alto", critical_low: "Crítico Baixo" };
    return map[flag] || flag;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Portal do Médico</h1>
            <p className="text-xs text-muted-foreground">Resultados dos seus pacientes em tempo real</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>Acesso auditado</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {!data ? (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto">
                <Stethoscope className="w-8 h-8 text-teal-700" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Acessar Resultados</h2>
              <p className="text-sm text-muted-foreground">
                Informe seu CRM e nome para consultar resultados dos seus pacientes.
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="crm">CRM</Label>
                    <Input
                      id="crm"
                      placeholder="Ex: 12345-SP"
                      value={crm}
                      onChange={(e) => setCrm(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Médico</Label>
                    <Input
                      id="name"
                      placeholder="Conforme cadastrado nos pedidos"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
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

            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              Acesso registrado conforme LGPD
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Doctor info */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-teal-700" />
                  </div>
                  <div>
                    <p className="font-semibold">{data.doctor_name}</p>
                    <p className="text-sm text-muted-foreground">CRM: {data.crm}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-emerald-700 bg-emerald-50 border-emerald-200">
                    {data.orders.length} pedido(s) com resultados
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Orders accordion */}
            <Accordion type="multiple" className="space-y-2">
              {data.orders.map((order, idx) => (
                <AccordionItem key={idx} value={`order-${idx}`} className="border rounded-lg bg-white px-1">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.patient_name} • {new Date(order.created_at).toLocaleDateString("pt-BR")} • {order.results.length} exame(s)
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {order.results.map((result) => (
                        <div key={result.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                          <div className="space-y-0.5">
                            <p className="font-medium text-sm">{result.exam}</p>
                            <p className="text-xs text-muted-foreground">
                              Ref: {result.reference_range || "—"} {result.unit && `(${result.unit})`}
                            </p>
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
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="text-center space-y-2 pt-4 border-t border-slate-200">
              <p className="text-[10px] text-muted-foreground">
                Acesso registrado para fins de auditoria e compliance LGPD.
              </p>
              <Button variant="outline" size="sm" onClick={() => { setData(null); setCrm(""); setDoctorName(""); }}>
                Nova Consulta
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalMedico;
