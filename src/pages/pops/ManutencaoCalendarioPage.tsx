import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarClock, Plus, ChevronLeft, ChevronRight, Wrench, CheckCircle2, Clock, AlertTriangle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "preventiva", label: "Preventiva" },
  { value: "corretiva", label: "Corretiva" },
  { value: "calibracao", label: "Calibração" },
  { value: "qualificacao", label: "Qualificação (OQ/PQ)" },
  { value: "limpeza", label: "Limpeza Programada" },
  { value: "outro", label: "Outro" },
];

const RECURRENCE = [
  { value: "unico", label: "Único" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
];

const STATUS_CFG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string }> = {
  pendente: { label: "Pendente", variant: "outline", color: "bg-muted" },
  agendado: { label: "Agendado", variant: "secondary", color: "bg-blue-500/20 border-blue-500/40" },
  concluido: { label: "Concluído", variant: "default", color: "bg-green-500/20 border-green-500/40" },
  atrasado: { label: "Atrasado", variant: "destructive", color: "bg-destructive/20 border-destructive/40" },
};

const INITIAL_FORM = {
  title: "",
  equipment_name: "",
  maintenance_type: "preventiva",
  scheduled_date: "",
  recurrence: "unico",
  responsible: "",
  notes: "",
  status: "agendado",
};

const ManutencaoCalendarioPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: maintenances = [], isLoading } = useQuery({
    queryKey: ["maintenances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_schedule")
        .select("*")
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        scheduled_date: form.scheduled_date || null,
        created_by: user?.id || null,
      };
      if (editing) {
        const { error } = await supabase.from("maintenance_schedule").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("maintenance_schedule").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenances"] });
      toast({ title: editing ? "Manutenção atualizada" : "Manutenção agendada" });
      closeForm();
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("maintenance_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenances"] });
      toast({ title: "Manutenção removida" });
    },
  });

  const toggleComplete = useMutation({
    mutationFn: async (item: any) => {
      const newStatus = item.status === "concluido" ? "agendado" : "concluido";
      const { error } = await supabase.from("maintenance_schedule")
        .update({ status: newStatus, completed_at: newStatus === "concluido" ? new Date().toISOString() : null })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maintenances"] }),
  });

  const openForm = (date?: Date, item?: any) => {
    if (item) {
      setEditing(item);
      setForm({
        title: item.title,
        equipment_name: item.equipment_name || "",
        maintenance_type: item.maintenance_type || "preventiva",
        scheduled_date: item.scheduled_date || "",
        recurrence: item.recurrence || "unico",
        responsible: item.responsible || "",
        notes: item.notes || "",
        status: item.status || "agendado",
      });
    } else {
      setEditing(null);
      setForm({ ...INITIAL_FORM, scheduled_date: date ? format(date, "yyyy-MM-dd") : "" });
    }
    setFormOpen(true);
  };

  const closeForm = () => { setFormOpen(false); setEditing(null); };
  const update = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  // Calendar computation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart); // 0=Sun

  const getEventsForDay = (day: Date) => {
    return maintenances.filter((m: any) => {
      if (!m.scheduled_date) return false;
      const matchType = typeFilter === "all" || m.maintenance_type === typeFilter;
      return matchType && isSameDay(parseISO(m.scheduled_date), day);
    });
  };

  const getComputedStatus = (m: any) => {
    if (m.status === "concluido") return "concluido";
    if (m.scheduled_date && isBefore(parseISO(m.scheduled_date), new Date()) && m.status !== "concluido") return "atrasado";
    return m.status;
  };

  const stats = {
    total: maintenances.length,
    concluido: maintenances.filter((m: any) => m.status === "concluido").length,
    agendado: maintenances.filter((m: any) => getComputedStatus(m) === "agendado").length,
    atrasado: maintenances.filter((m: any) => getComputedStatus(m) === "atrasado").length,
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            Calendário de Manutenções
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Cronograma de manutenções preventivas, corretivas e calibrações</p>
        </div>
        <Button className="gap-2" onClick={() => openForm()}>
          <Plus className="h-4 w-4" />
          Agendar Manutenção
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Wrench className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10"><Clock className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-2xl font-bold">{stats.agendado}</p><p className="text-xs text-muted-foreground">Agendadas</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
          <div><p className="text-2xl font-bold">{stats.concluido}</p><p className="text-xs text-muted-foreground">Concluídas</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
          <div><p className="text-2xl font-bold">{stats.atrasado}</p><p className="text-xs text-muted-foreground">Atrasadas</p></div>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-5 w-5" /></Button>
              <CardTitle className="text-lg capitalize">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-5 w-5" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                <div key={d} className="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
              {Array.from({ length: startPadding }).map((_, i) => (
                <div key={`pad-${i}`} className="bg-background p-2 min-h-[80px]" />
              ))}
              {days.map((day) => {
                const events = getEventsForDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "bg-background p-1.5 min-h-[80px] cursor-pointer hover:bg-muted/30 transition-colors border",
                      isToday(day) && "bg-primary/5",
                      isSelected && "ring-2 ring-primary",
                      !isSameMonth(day, currentMonth) && "opacity-40"
                    )}
                    onClick={() => setSelectedDate(day)}
                  >
                    <span className={cn("text-xs font-medium", isToday(day) && "text-primary font-bold")}>
                      {format(day, "d")}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {events.slice(0, 3).map((ev: any) => {
                        const cs = getComputedStatus(ev);
                        const cfg = STATUS_CFG[cs] || STATUS_CFG.pendente;
                        return (
                          <div key={ev.id} className={cn("text-[9px] px-1 py-0.5 rounded truncate border", cfg.color)}>
                            {ev.title}
                          </div>
                        );
                      })}
                      {events.length > 3 && <span className="text-[9px] text-muted-foreground">+{events.length - 3} mais</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Side Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : "Selecione um dia"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedDate && (
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => openForm(selectedDate)}>
                <Plus className="h-3.5 w-3.5" /> Agendar neste dia
              </Button>
            )}
            {selectedDayEvents.length === 0 && selectedDate && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma manutenção agendada</p>
            )}
            {selectedDayEvents.map((ev: any) => {
              const cs = getComputedStatus(ev);
              const cfg = STATUS_CFG[cs];
              const typeLabel = TYPES.find((t) => t.value === ev.maintenance_type)?.label || ev.maintenance_type;
              return (
                <div key={ev.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium leading-snug">{ev.title}</p>
                    <Badge variant={cfg.variant} className="text-[10px] shrink-0 ml-2">{cfg.label}</Badge>
                  </div>
                  {ev.equipment_name && <p className="text-xs text-muted-foreground">Equip.: {ev.equipment_name}</p>}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{typeLabel}</Badge>
                    {ev.recurrence !== "unico" && (
                      <Badge variant="outline" className="text-[10px]">{RECURRENCE.find((r) => r.value === ev.recurrence)?.label}</Badge>
                    )}
                  </div>
                  {ev.responsible && <p className="text-xs text-muted-foreground">Resp.: {ev.responsible}</p>}
                  <div className="flex gap-1 pt-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => toggleComplete.mutate(ev)}>
                      <CheckCircle2 className="h-3 w-3" /> {cs === "concluido" ? "Reabrir" : "Concluir"}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openForm(undefined, ev)}>Editar</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => deleteMutation.mutate(ev.id)}>Excluir</Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Manutenção" : "Agendar Manutenção"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input placeholder="Ex: Manutenção Preventiva — Centrífuga" value={form.title} onChange={(e) => update("title", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Equipamento</Label>
              <Input placeholder="Ex: Centrífuga Eppendorf 5804R" value={form.equipment_name} onChange={(e) => update("equipment_name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.maintenance_type} onValueChange={(v) => update("maintenance_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recorrência</Label>
                <Select value={form.recurrence} onValueChange={(v) => update("recurrence", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RECURRENCE.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Agendada *</Label>
                <Input type="date" value={form.scheduled_date} onChange={(e) => update("scheduled_date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Input placeholder="Nome do responsável" value={form.responsible} onChange={(e) => update("responsible", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Detalhes adicionais..." rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={closeForm}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title || !form.scheduled_date || saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManutencaoCalendarioPage;
