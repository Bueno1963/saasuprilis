import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Clock, User, CalendarDays, Trash2, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import WeeklyCalendarView from "@/components/recepcao/WeeklyCalendarView";

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

const AgendamentoPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Form state
  const [form, setForm] = useState({
    patient_id: "",
    scheduled_time: "08:00",
    duration_minutes: 30,
    type: "exame",
    notes: "",
  });

  // Fetch daily limit from lab_settings
  const { data: labSettings } = useQuery({
    queryKey: ["lab_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lab_settings").select("daily_appointment_limit").limit(1).single();
      if (error) throw error;
      return data;
    },
  });
  const dailyLimit = labSettings?.daily_appointment_limit ?? 0;

  // Fetch patients for the select
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

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery({
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

  // Appointments for selected date
  const dayAppointments = useMemo(
    () =>
      appointments.filter((a: any) =>
        isSameDay(parseISO(a.scheduled_date), selectedDate)
      ),
    [appointments, selectedDate]
  );

  // Active appointments (exclude cancelled) for limit check
  const activeDayCount = useMemo(
    () => dayAppointments.filter((a: any) => a.status !== "cancelado").length,
    [dayAppointments]
  );
  const isLimitReached = dailyLimit > 0 && activeDayCount >= dailyLimit;

  // Filtered by search
  const filteredAppointments = useMemo(() => {
    if (!search) return dayAppointments;
    const q = search.toLowerCase();
    return dayAppointments.filter(
      (a: any) =>
        a.patients?.name?.toLowerCase().includes(q) ||
        a.patients?.cpf?.includes(q) ||
        a.type?.toLowerCase().includes(q)
    );
  }, [dayAppointments, search]);

  // Dates that have appointments (for calendar dots)
  const datesWithAppointments = useMemo(
    () => new Set(appointments.map((a: any) => a.scheduled_date)),
    [appointments]
  );

  // Create appointment
  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("appointments").insert({
        patient_id: form.patient_id,
        scheduled_date: format(selectedDate, "yyyy-MM-dd"),
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

  // Update status
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

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento removido!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Count pending for today
  const todayPending = useMemo(
    () =>
      appointments.filter(
        (a: any) =>
          isSameDay(parseISO(a.scheduled_date), new Date()) &&
          a.status === "agendado"
      ).length,
    [appointments]
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agendamento</h1>
          <p className="text-sm text-muted-foreground">
            {todayPending > 0
              ? `${todayPending} agendamento(s) pendente(s) para hoje`
              : "Nenhum pendente para hoje"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("day")}
            >
              <List className="h-4 w-4 mr-1" /> Dia
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("week")}
            >
              <LayoutGrid className="h-4 w-4 mr-1" /> Semana
            </Button>
          </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={isLimitReached}>
              <Plus className="h-4 w-4" /> Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.patient_id) {
                  toast.error("Selecione um paciente");
                  return;
                }
                if (isLimitReached) {
                  toast.error(`Limite diário de ${dailyLimit} atendimentos atingido para esta data.`);
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
                  <Label>Data</Label>
                  <Input value={format(selectedDate, "dd/MM/yyyy")} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={form.scheduled_time}
                    onChange={(e) => setForm((f) => ({ ...f, scheduled_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exame">Exame</SelectItem>
                      <SelectItem value="coleta">Coleta</SelectItem>
                      <SelectItem value="retorno">Retorno</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duração (min)</Label>
                  <Input
                    type="number"
                    min={5}
                    value={form.duration_minutes}
                    onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
                  />
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
                {createMutation.isPending ? "Salvando..." : "Confirmar Agendamento"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {viewMode === "week" ? (
        <WeeklyCalendarView
          selectedDate={selectedDate}
          appointments={appointments}
          onSelectDate={setSelectedDate}
        />
      ) : (
        /* Content grid - Day view */
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Calendar */}
          <div className="bg-card border border-border rounded-xl p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              locale={ptBR}
              className={cn("p-0 pointer-events-auto")}
              modifiers={{
                hasAppointment: (date: Date) =>
                  datesWithAppointments.has(format(date, "yyyy-MM-dd")),
              }}
              modifiersClassNames={{
                hasAppointment: "bg-primary/15 font-bold text-primary",
              }}
            />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <CalendarDays className="inline h-4 w-4 mr-1" />
              {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
            {/* Capacity indicator */}
            <div className={cn(
              "mt-3 rounded-lg p-3 text-center",
              isLimitReached ? "bg-destructive/10 border border-destructive/30" : "neu-inset"
            )}>
              <p className="text-xs font-medium text-muted-foreground mb-1">Atendimentos do dia</p>
              <p className={cn(
                "text-2xl font-bold",
                isLimitReached ? "text-destructive" : "text-foreground"
              )}>
                {activeDayCount}
                {dailyLimit > 0 && <span className="text-base font-normal text-muted-foreground">/{dailyLimit}</span>}
              </p>
              {dailyLimit > 0 && (
                <>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isLimitReached ? "bg-destructive" : "bg-primary"
                      )}
                      style={{ width: `${Math.min((activeDayCount / dailyLimit) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {isLimitReached
                      ? "Limite atingido"
                      : `${dailyLimit - activeDayCount} vaga(s) restante(s)`}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Appointments list */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Input
                placeholder="Buscar paciente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <span className="text-sm text-muted-foreground ml-auto flex items-center gap-2">
                {filteredAppointments.length} agendamento(s)
                {dailyLimit > 0 && (
                  <Badge variant={isLimitReached ? "destructive" : "outline"} className="text-[10px]">
                    {activeDayCount}/{dailyLimit}
                  </Badge>
                )}
              </span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : filteredAppointments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum agendamento para esta data.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        <Clock className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        {a.scheduled_time?.slice(0, 5)}
                      </TableCell>
                      <TableCell>
                        <User className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        {a.patients?.name || "—"}
                      </TableCell>
                      <TableCell className="capitalize">{a.type}</TableCell>
                      <TableCell>
                        <Select
                          value={a.status}
                          onValueChange={(v) => updateStatusMutation.mutate({ id: a.id, status: v, appointment: a })}
                        >
                          <SelectTrigger className="w-[130px] h-7 text-xs">
                            <Badge variant="outline" className={cn("text-[10px]", statusColors[a.status])}>
                              {statusLabels[a.status] || a.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(a.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendamentoPage;
