import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  FileText, Shield, Search, AlertCircle, CheckCircle,
  Loader2, Calendar, Clock, CalendarPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoDraDielem from "@/assets/logo-dra-dielem.png";

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
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<PortalTab>(
    searchParams.get("tab") === "agendamento" ? "agendamento" : "resultados"
  );

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
  const [occupiedSlots, setOccupiedSlots] = useState<Set<string>>(new Set());
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [schedForm, setSchedForm] = useState({
    date: "",
    time: "",
    type: "exame",
    notes: "",
  });

  const TIME_SLOTS = Array.from({ length: 22 }, (_, i) => {
    const h = Math.floor(i / 2) + 7;
    const m = (i % 2) * 30;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  });

  const fetchOccupiedSlots = useCallback(async (date: string) => {
    if (!date) return;
    setSlotsLoading(true);
    try {
      const { data: appts } = await supabase
        .from("appointments")
        .select("scheduled_time")
        .eq("scheduled_date", date)
        .neq("status", "cancelado");
      const occupied = new Set((appts || []).map((a: any) => a.scheduled_time?.slice(0, 5)));
      setOccupiedSlots(occupied);
    } catch {
      setOccupiedSlots(new Set());
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (schedForm.date) {
      fetchOccupiedSlots(schedForm.date);
      setSchedForm((f) => ({ ...f, time: "" }));
    }
  }, [schedForm.date, fetchOccupiedSlots]);

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
      const { data: patientData } = await supabase
        .from("patients")
        .select("email")
        .eq("id", schedPatient.id)
        .single();
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
      if (patientData?.email) {
        supabase.functions.invoke("send-appointment-confirmation", {
          body: {
            patient_name: schedPatient.name,
            patient_email: patientData.email,
            scheduled_date: schedForm.date,
            scheduled_time: schedForm.time,
            appointment_type: schedForm.type,
          },
        }).then(({ error }) => {
          if (error) console.error("Erro ao enviar e-mail:", error);
          else toast.success("E-mail de confirmação enviado!");
        });
      }
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
    setSchedForm({ date: "", time: "", type: "exame", notes: "" });
    setOccupiedSlots(new Set());
    setSchedCpf("");
    setSchedBirthDate("");
  };

  const getFlagColor = (flag: string) => {
    if (flag === "high" || flag === "critical_high") return "text-red-600 bg-red-50";
    if (flag === "low" || flag === "critical_low") return "text-blue-600 bg-blue-50";
    return "text-emerald-700 bg-emerald-50";
  };

  const getFlagLabel = (flag: string) => {
    const map: Record<string, string> = {
      normal: "Normal", high: "Alto", low: "Baixo",
      critical_high: "Crítico Alto", critical_low: "Crítico Baixo",
    };
    return map[flag] || flag;
  };

  const today = format(new Date(), "yyyy-MM-dd");

  // When results are loaded, show full-width results view
  if (data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <header className="bg-[hsl(205,78%,20%)] text-white">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <img src={logoDraDielem} alt="Logo" className="h-12 w-auto rounded bg-white p-1" />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Portal do Paciente</h1>
              <p className="text-xs text-white/70">Resultados de Exames</p>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
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
            <CardContent className="pt-6">
              <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Resultados Liberados ({data.results.length})
              </h3>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="lg:w-[40%] bg-gradient-to-br from-[hsl(205,78%,20%)] via-[hsl(205,78%,25%)] to-[hsl(205,70%,30%)] text-white relative overflow-hidden flex flex-col">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-20 left-0 w-48 h-48 bg-white/5 rounded-full -translate-x-1/2" />

        <div className="relative z-10 flex flex-col justify-between p-6 lg:p-10 flex-1">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src={logoDraDielem}
              alt="Laboratório Dra. Dielem Feijó"
              className="h-12 w-auto rounded-lg bg-white/95 p-1.5 shadow-lg"
            />
            <div>
              <h1 className="text-base font-bold tracking-tight">Laboratório Dra. Dielem</h1>
              <p className="text-[10px] text-white/60">Sistema de Gestão Laboratorial</p>
            </div>
          </div>

          {/* Welcome message */}
          <div className="my-6 lg:my-0 space-y-4">
            <p className="text-base text-white/90 font-medium">
              Prezado paciente,
            </p>
            <blockquote className="text-sm lg:text-base leading-relaxed text-white/80 italic border-l-2 border-white/30 pl-4">
              "Ficamos muito Felizes por escolher nosso Laboratório, trabalhamos com tecnologia de ponta para garantir a fidelidade do resultado.
              Seu diagnóstico preciso é o produto final do nosso esforço"
            </blockquote>
            <p className="text-lg font-semibold text-white/95 font-serif italic">
              Dra. Dielem Feijó
            </p>
          </div>

          {/* Footer */}
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} — Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* Right Panel - Forms */}
      <div className="lg:w-[60%] flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
        {/* Tab Switcher */}
        <div className="border-b border-slate-200 bg-white">
          <div className="flex max-w-lg mx-auto">
            <button
              onClick={() => setActiveTab("resultados")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 px-6 text-sm font-semibold border-b-2 transition-all",
                activeTab === "resultados"
                  ? "border-[hsl(205,78%,35%)] text-[hsl(205,78%,35%)]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="w-4 h-4" />
              Resultados
            </button>
            <button
              onClick={() => setActiveTab("agendamento")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 px-6 text-sm font-semibold border-b-2 transition-all",
                activeTab === "agendamento"
                  ? "border-[hsl(205,78%,35%)] text-[hsl(205,78%,35%)]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarPlus className="w-4 h-4" />
              Agendar Exame
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex items-start justify-center p-6 lg:p-8 overflow-y-auto">
          <div className="w-full max-w-md space-y-5">
            {/* ===================== RESULTADOS TAB ===================== */}
            {activeTab === "resultados" && (
              <>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-[hsl(205,78%,35%)]/10 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6 text-[hsl(205,78%,35%)]" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Consultar Resultados</h2>
                  <p className="text-sm text-muted-foreground">
                    Informe o número do pedido e sua data de nascimento para acessar seus exames.
                  </p>
                </div>

                <Card className="shadow-lg border-slate-200/80">
                  <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="order" className="text-sm font-semibold text-[hsl(205,78%,25%)]">
                          Protocolo de atendimento
                        </Label>
                        <Input
                          id="order"
                          placeholder="Ex: ORD-2026-001"
                          value={orderNumber}
                          onChange={(e) => setOrderNumber(e.target.value)}
                          required
                          className="h-12 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthdate" className="text-sm font-semibold text-[hsl(205,78%,25%)]">
                          Data nascimento
                        </Label>
                        <Input
                          id="birthdate"
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          required
                          className="h-12 text-sm"
                        />
                      </div>

                      {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full h-12 text-sm font-semibold bg-[hsl(205,78%,35%)] hover:bg-[hsl(205,78%,30%)] text-white rounded-lg"
                        disabled={loading}
                      >
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

                <div className="text-center space-y-1 pt-2">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Shield className="w-3 h-3" />
                    Seus dados são protegidos conforme a LGPD
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Todo acesso é registrado para sua segurança
                  </p>
                </div>
              </>
            )}

            {/* ===================== AGENDAMENTO TAB ===================== */}
            {activeTab === "agendamento" && (
              <>
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
                  <>
                    <div className="text-center space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-[hsl(205,78%,35%)]/10 flex items-center justify-center mx-auto">
                        <CalendarPlus className="w-7 h-7 text-[hsl(205,78%,35%)]" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">Agendar Exame</h2>
                      <p className="text-sm text-muted-foreground">
                        Informe seu CPF e data de nascimento para se identificar.
                      </p>
                    </div>

                    <Card className="shadow-lg border-slate-200/80">
                      <CardContent className="pt-6">
                        <form onSubmit={handleIdentify} className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="sched-cpf" className="text-sm font-semibold text-[hsl(205,78%,25%)]">CPF</Label>
                            <Input
                              id="sched-cpf"
                              placeholder="000.000.000-00"
                              value={schedCpf}
                              onChange={(e) => setSchedCpf(e.target.value)}
                              required
                              className="h-12 text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sched-birth" className="text-sm font-semibold text-[hsl(205,78%,25%)]">Data de Nascimento</Label>
                            <Input
                              id="sched-birth"
                              type="date"
                              value={schedBirthDate}
                              onChange={(e) => setSchedBirthDate(e.target.value)}
                              required
                              className="h-12 text-sm"
                            />
                          </div>

                          {schedError && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              {schedError}
                            </div>
                          )}

                          <Button
                            type="submit"
                            className="w-full h-12 text-sm font-semibold bg-[hsl(205,78%,35%)] hover:bg-[hsl(205,78%,30%)] text-white rounded-lg"
                            disabled={schedLoading}
                          >
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
                  <>
                    <div className="text-center space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-[hsl(205,78%,35%)]/10 flex items-center justify-center mx-auto">
                        <Calendar className="w-7 h-7 text-[hsl(205,78%,35%)]" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">Escolha Data e Horário</h2>
                      <p className="text-sm text-muted-foreground">
                        Olá, <strong>{schedPatient.name}</strong>! Selecione quando deseja realizar seu exame.
                      </p>
                    </div>

                    <Card className="shadow-lg border-slate-200/80">
                      <CardContent className="pt-6">
                        <form onSubmit={handleSchedule} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="sched-date" className="text-sm font-semibold text-[hsl(205,78%,25%)]">Data</Label>
                            <Input
                              id="sched-date"
                              type="date"
                              min={today}
                              value={schedForm.date}
                              onChange={(e) => setSchedForm((f) => ({ ...f, date: e.target.value }))}
                              required
                              className="h-12 text-sm"
                            />
                          </div>
                          {schedForm.date && (
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-[hsl(205,78%,25%)]">Horário disponível</Label>
                              {slotsLoading ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Verificando disponibilidade...
                                </div>
                              ) : (
                                <div className="grid grid-cols-4 gap-1.5">
                                  {TIME_SLOTS.map((slot) => {
                                    const isOccupied = occupiedSlots.has(slot);
                                    const isSelected = schedForm.time === slot;
                                    return (
                                      <button
                                        key={slot}
                                        type="button"
                                        disabled={isOccupied}
                                        onClick={() => setSchedForm((f) => ({ ...f, time: slot }))}
                                        className={cn(
                                          "py-2 px-1 rounded-md text-xs font-medium border transition-all",
                                          isOccupied
                                            ? "bg-muted text-muted-foreground/40 border-border cursor-not-allowed line-through"
                                            : isSelected
                                              ? "bg-[hsl(205,78%,35%)] text-white border-[hsl(205,78%,35%)] shadow-sm"
                                              : "bg-card text-foreground border-border hover:border-[hsl(205,78%,45%)] hover:bg-[hsl(205,78%,95%)]"
                                        )}
                                      >
                                        <Clock className="w-3 h-3 inline mr-0.5" />
                                        {slot}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                              {!slotsLoading && occupiedSlots.size > 0 && (
                                <p className="text-[11px] text-muted-foreground">
                                  Horários riscados já estão ocupados.
                                </p>
                              )}
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-[hsl(205,78%,25%)]">Tipo</Label>
                            <Select value={schedForm.type} onValueChange={(v) => setSchedForm((f) => ({ ...f, type: v }))}>
                              <SelectTrigger className="h-12">
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
                            <Label className="text-sm font-semibold text-[hsl(205,78%,25%)]">Observações (opcional)</Label>
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

                          <Button
                            type="submit"
                            className="w-full h-12 text-sm font-semibold bg-[hsl(205,78%,35%)] hover:bg-[hsl(205,78%,30%)] text-white rounded-lg"
                            disabled={schedLoading || !schedForm.time || !schedForm.date}
                          >
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

                <div className="text-center space-y-1 pt-2">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Shield className="w-3 h-3" />
                    Seus dados são protegidos conforme a LGPD
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Todo acesso é registrado para sua segurança
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalPaciente;
