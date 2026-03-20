import { useNavigate } from "react-router-dom";
import { UserPlus, Calendar, FileCheck, Clock, User, Plus, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isSameDay, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import DigitalClockToggle from "@/components/recepcao/DigitalClockToggle";

const statusColors: Record<string, string> = {
  agendado: "bg-blue-100 text-blue-800 border-blue-200",
  confirmado: "bg-green-100 text-green-800 border-green-200",
  cancelado: "bg-red-100 text-red-800 border-red-200",
  atendido: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusLabels: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  atendido: "Atendido",
};

const RecepcaoPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    patient_id: "",
    scheduled_time: "08:00",
    duration_minutes: 30,
    type: "exame",
    notes: "",
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, cpf")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: labSettings } = useQuery({
    queryKey: ["lab_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lab_settings").select("daily_appointment_limit").limit(1).single();
      if (error) throw error;
      return data;
    },
  });
  const dailyLimit = labSettings?.daily_appointment_limit ?? 0;

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, patients(name, cpf)")
        .order("scheduled_date")
        .order("scheduled_time");
      if (error) throw error;
      return data;
    },
  });

  const todayAppointments = useMemo(
    () => appointments.filter((a: any) => isSameDay(parseISO(a.scheduled_date), new Date())),
    [appointments]
  );

  const todayPending = useMemo(
    () => todayAppointments.filter((a: any) => a.status === "agendado").length,
    [todayAppointments]
  );

  const todayActiveCount = useMemo(
    () => todayAppointments.filter((a: any) => a.status !== "cancelado").length,
    [todayAppointments]
  );
  const isLimitReached = dailyLimit > 0 && todayActiveCount >= dailyLimit;

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("appointments").insert({
        patient_id: form.patient_id,
        scheduled_date: format(new Date(), "yyyy-MM-dd"),
        scheduled_time: form.scheduled_time,
        duration_minutes: form.duration_minutes,
        type: form.type,
        notes: form.notes,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento criado com sucesso!");
      setDialogOpen(false);
      setForm({ patient_id: "", scheduled_time: "08:00", duration_minutes: 30, type: "exame", notes: "" });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const sendWhatsAppConfirmation = (appointment: any) => {
    const patientName = appointment.patients?.name || "Paciente";
    const phone = "(mock)";
    const time = appointment.scheduled_time?.slice(0, 5);
    const date = format(parseISO(appointment.scheduled_date), "dd/MM/yyyy");
    console.log(`[MOCK] WhatsApp enviado para ${patientName} ${phone}: Seu agendamento em ${date} às ${time} foi confirmado.`);
    toast.success(
      `📱 WhatsApp enviado para ${patientName}`,
      { description: `Confirmação do agendamento em ${date} às ${time}. (simulado)` }
    );
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, appointment }: { id: string; status: string; appointment?: any }) => {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw error;
      return { status, appointment };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Status atualizado!");
      if (result?.status === "confirmado" && result?.appointment) {
        sendWhatsAppConfirmation(result.appointment);
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  const sections = [
    { key: "cadastro", title: "Cadastro Pacientes", icon: UserPlus, href: "/pacientes" },
    {
      key: "agendamento",
      title: "Agendamento",
      subtitle: todayPending > 0 ? `${todayPending} pendente(s)` : "Nenhum pendente",
      icon: Calendar,
      href: "/recepcao/agendamento",
    },
    { key: "resultados", title: "Resultados", icon: FileCheck, href: "/laudos/liberados" },
  ];

  return (
    <div className="flex-1 flex flex-col p-6 gap-6">
      {/* Digital Clock */}
      <DigitalClock />
      {/* Quick-access buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mx-auto">
        {sections.map(({ key, title, subtitle, icon: Icon, href }) => (
          <Card
            key={key}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(href)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">{title}</CardTitle>
              <Icon className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's schedule - integrated */}
      <div className="bg-card border border-border rounded-xl overflow-hidden max-w-5xl w-full mx-auto">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Agenda de Hoje
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })} — {todayAppointments.length} agendamento(s)
              {dailyLimit > 0 && (
                <Badge variant={isLimitReached ? "destructive" : "outline"} className="text-[10px]">
                  {todayActiveCount}/{dailyLimit} vagas
                </Badge>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5" disabled={isLimitReached}>
                  <Plus className="h-4 w-4" /> Agendar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo Agendamento — Hoje</DialogTitle>
                </DialogHeader>
                {isLimitReached && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                    Limite diário de {dailyLimit} atendimentos atingido.
                  </div>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!form.patient_id) {
                      toast.error("Selecione um paciente");
                      return;
                    }
                    if (isLimitReached) {
                      toast.error(`Limite diário de ${dailyLimit} atendimentos atingido.`);
                      return;
                    }
                    createMutation.mutate();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Paciente</Label>
                    <Select value={form.patient_id} onValueChange={(v) => setForm((f) => ({ ...f, patient_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — {p.cpf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Horário</Label>
                      <Input
                        type="time"
                        value={form.scheduled_time}
                        onChange={(e) => setForm((f) => ({ ...f, scheduled_time: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exame">Exame</SelectItem>
                          <SelectItem value="coleta">Coleta</SelectItem>
                          <SelectItem value="retorno">Retorno</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Notas adicionais..."
                      rows={2}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Salvando..." : "Confirmar"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate("/recepcao/agendamento")}
            >
              Ver completo <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            Nenhum agendamento para hoje.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {todayAppointments.map((a: any) => (
              <div
                key={a.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-sm font-medium min-w-[60px]">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {a.scheduled_time?.slice(0, 5)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {a.patients?.name || "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground capitalize">{a.type}</p>
                </div>
                <Select
                  value={a.status}
                  onValueChange={(v) => updateStatusMutation.mutate({ id: a.id, status: v, appointment: a })}
                >
                  <SelectTrigger className="w-[120px] h-7 text-xs">
                    <Badge variant="outline" className={cn("text-[10px]", statusColors[a.status])}>
                      {statusLabels[a.status] || a.status}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecepcaoPage;
