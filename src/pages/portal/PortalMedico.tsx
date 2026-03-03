import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Stethoscope, Shield, Search, AlertCircle, CheckCircle, Loader2, User, FileText, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import logoDraDielem from "@/assets/logo-dra-dielem.png";

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

  // Results view - full width
  if (data) {
    return (
      <div className="min-h-screen bg-background">
        <header className="neu-flat rounded-none">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4" style={{ background: 'hsl(var(--sidebar-background))' }}>
            <img src={logoDraDielem} alt="Logo" className="h-12 w-auto rounded bg-white p-1" />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Portal do Médico</h1>
              <p className="text-xs text-white/70">Resultados dos seus pacientes</p>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full neu-inset flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{data.doctor_name}</p>
                  <p className="text-sm text-muted-foreground">CRM: {data.crm}</p>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {data.orders.length} pedido(s)
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Accordion type="multiple" className="space-y-2">
            {data.orders.map((order, idx) => (
              <AccordionItem key={idx} value={`order-${idx}`} className="border-0 rounded-xl neu-flat-sm px-1 mb-2">
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
                      <div key={result.id} className="flex items-center justify-between p-3 rounded-xl neu-inset">
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

          <div className="text-center space-y-2 pt-4 border-t border-border">
            <p className="text-[10px] text-muted-foreground">
              Acesso registrado para fins de auditoria e compliance LGPD.
            </p>
            <Button variant="outline" size="sm" onClick={() => { setData(null); setCrm(""); setDoctorName(""); }}>
              Nova Consulta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Login view - matches Auth page style
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-[860px] min-h-[480px] rounded-2xl overflow-hidden neu-flat">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--sidebar-background))] via-[hsl(213,45%,22%)] to-[hsl(213,49%,12%)]" />
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />

          <div className="relative z-10 flex flex-col justify-between p-7 w-full">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src={logoDraDielem}
                alt="Laboratório Dra. Dielem Feijó"
                className="h-9 w-auto rounded-lg bg-white/95 p-1 shadow-lg"
              />
            </div>

            {/* Main content */}
            <div className="space-y-3 max-w-sm">
              <h1 className="text-2xl font-bold text-white leading-tight">
                Portal do{" "}
                <span className="text-primary">Médico</span>
              </h1>
              <p className="text-white/75 text-xs leading-relaxed">
                Acesse os resultados laboratoriais dos seus pacientes em tempo real. 
                Todos os exames liberados ficam disponíveis para consulta imediata, 
                com total segurança e conformidade com a LGPD.
              </p>
            </div>

            {/* Footer */}
            <p className="text-white/40 text-[10px]">© {new Date().getFullYear()} — Todos os direitos reservados</p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="flex-1 flex items-center justify-center p-5 sm:p-8 bg-background">
          <div className="w-full max-w-sm space-y-5">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 justify-center mb-2">
              <img src={logoDraDielem} alt="Logo" className="h-9 w-auto rounded-lg" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">Acessar Resultados</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Informe seu CRM e nome para consultar
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="crm">CRM</Label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="crm"
                    placeholder="Ex: 12345-SP"
                    value={crm}
                    onChange={(e) => setCrm(e.target.value)}
                    required
                    className="pl-10 h-11 border-border/60 focus:border-accent"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Médico</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Conforme cadastrado nos pedidos"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    required
                    className="pl-10 h-11 border-border/60 focus:border-accent"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-medium gap-2 rounded-xl transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    Consultar Resultados
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              Acesso registrado conforme LGPD
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalMedico;
