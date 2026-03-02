import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity, FileText, Shield, Search, AlertCircle, CheckCircle,
  Loader2, Calendar, Clock, CalendarPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

type PortalTab = "resultados" | "agendamento";

const PortalPaciente = () => {
  const [activeTab, setActiveTab] = useState<PortalTab>("resultados");

  // === Results state ===
  const [orderNumber, setOrderNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ResultData | null>(null);

  // === Scheduling state ===
  const [schedCpf, setSchedCpf] = useState("");
  const [schedBirthDate, setSchedBirthDate] = useState("");
  const [schedPatient, setSchedPatient] = useState<{ id: string; name: string } | null>(null);
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedError, setSchedError] = useState("");
  const [schedSuccess, setSchedSuccess] = useState(false);
  const [schedForm, setSchedForm] = useState({
    date: "",
    time: "08:00",
    type: "exame",
    notes: "",
  });

  // === Results handlers ===
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

  // === Scheduling handlers ===
  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedCpf.trim() || !schedBirthDate) return;

    setSchedLoading(true);
    setSchedError("");
    setSchedPatient(null);

    try {
      const { data: patients, error: pErr } = await supabase
        .from("patients")
        .select("id, name, birth_date")
        .eq("cpf", schedCpf.trim())
        .limit(1);

      if (pErr) throw pErr;
      if (!patients || patients.length === 0) {
        setSchedError("Paciente não encontrado. Verifique o CPF informado.");
        return;
      }

      const patient = patients[0];
      if (patient.birth_date !== schedBirthDate) {
        setSchedError("Data de nascimento não confere. Verifique os dados.");
        return;
      }

      setSchedPatient({ id: patient.id, name: patient.name });
    } catch (err: any) {
      setSchedError(err?.message || "Erro ao identificar paciente.");
    } finally {
      setSchedLoading(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedPatient || !schedForm.date || !schedForm.time) return;

    setSchedLoading(true);
    setSchedError("");

    try {
      const { error: insertErr } = await supabase.from("appointments").insert({
        patient_id: schedPatient.id,
        scheduled_date: schedForm.date,
        scheduled_time: schedForm.time,
        type: schedForm.type,
        notes: schedForm.notes || "",
        status: "agendado",
      });

      if (insertErr) throw insertErr;

      setSchedSuccess(true);
      toast.success("Agendamento realizado com sucesso!");
    } catch (err: any) {
      setSchedError(err?.message || "Erro ao criar agendamento.");
    } finally {
      setSchedLoading(false);
    }
  };

  const resetSchedule = () => {
    setSchedPatient(null);
    setSchedSuccess(false);
    setSchedError("");
    setSchedForm({ date: "", time: "08:00", type: "exame", notes: "" });
    setSchedCpf("");
    setSchedBirthDate("");
  };

  // === Helpers ===
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

  const today = format(new Date(), "yyyy-MM-dd");

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
            <p className="text-xs text-muted-foreground">Resultados e agendamento online</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>Acesso seguro</span>
          </div>
        </div>
      </header>

      {/* Tab Switcher */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex gap-1 bg-muted/60 rounded-lg p-1 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("resultados")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all",
              activeTab === "resultados"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="w-4 h-4" />
            Resultados
          </button>
          <button
            onClick={() => setActiveTab("agendamento")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all",
              activeTab === "agendamento"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarPlus className="w-4 h-4" />
            Agendar Exame
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ===================== RESULTADOS TAB ===================== */}
        {activeTab === "resultados" && (
          <>
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
          </>
        )}

        {/* ===================== AGENDAMENTO TAB ===================== */}
        {activeTab === "agendamento" && (
          <div className="max-w-md mx-auto space-y-6">
            {/* Success state */}
            {schedSuccess ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Agendamento Confirmado!</h2>
                <p className="text-sm text-muted-foreground">
                  Seu exame foi agendado para{" "}
                  <strong>{schedForm.date ? format(new Date(schedForm.date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }) : ""}</strong>{" "}
                  às <strong>{schedForm.time}</strong>.
                </p>
                <p className="text-xs text-muted-foreground">
                  Compareça ao laboratório no horário agendado com documento de identidade e pedido médico.
                </p>
                <Button variant="outline" onClick={resetSchedule}>
                  Novo Agendamento
                </Button>
              </div>
            ) : !schedPatient ? (
              /* Step 1: Identify patient */
              <>
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <CalendarPlus className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Agendar Exame</h2>
                  <p className="text-sm text-muted-foreground">
                    Informe seu CPF e data de nascimento para se identificar.
                  </p>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <form onSubmit={handleIdentify} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="sched-cpf">CPF</Label>
                        <Input
                          id="sched-cpf"
                          placeholder="000.000.000-00"
                          value={schedCpf}
                          onChange={(e) => setSchedCpf(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sched-birth">Data de Nascimento</Label>
                        <Input
                          id="sched-birth"
                          type="date"
                          value={schedBirthDate}
                          onChange={(e) => setSchedBirthDate(e.target.value)}
                          required
                        />
                      </div>

                      {schedError && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {schedError}
                        </div>
                      )}

                      <Button type="submit" className="w-full" disabled={schedLoading}>
                        {schedLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4 mr-2" />
                            Identificar
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Step 2: Schedule form */
              <>
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Calendar className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Escolha Data e Horário</h2>
                  <p className="text-sm text-muted-foreground">
                    Olá, <strong>{schedPatient.name}</strong>! Selecione quando deseja realizar seu exame.
                  </p>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <form onSubmit={handleSchedule} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="sched-date">Data</Label>
                        <Input
                          id="sched-date"
                          type="date"
                          min={today}
                          value={schedForm.date}
                          onChange={(e) => setSchedForm((f) => ({ ...f, date: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sched-time">Horário</Label>
                        <Input
                          id="sched-time"
                          type="time"
                          value={schedForm.time}
                          onChange={(e) => setSchedForm((f) => ({ ...f, time: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={schedForm.type} onValueChange={(v) => setSchedForm((f) => ({ ...f, type: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exame">Exame</SelectItem>
                            <SelectItem value="coleta">Coleta</SelectItem>
                            <SelectItem value="retorno">Retorno</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Observações (opcional)</Label>
                        <Textarea
                          value={schedForm.notes}
                          onChange={(e) => setSchedForm((f) => ({ ...f, notes: e.target.value }))}
                          placeholder="Informações adicionais..."
                          rows={2}
                        />
                      </div>

                      {schedError && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {schedError}
                        </div>
                      )}

                      <Button type="submit" className="w-full" disabled={schedLoading}>
                        {schedLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Agendando...
                          </>
                        ) : (
                          <>
                            <CalendarPlus className="w-4 h-4 mr-2" />
                            Confirmar Agendamento
                          </>
                        )}
                      </Button>
                      <Button type="button" variant="ghost" className="w-full" onClick={resetSchedule}>
                        Voltar
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </>
            )}

            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Seus dados são protegidos conforme a LGPD
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalPaciente;
