import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TestTubes, FlaskConical, Microscope, BadgeCheck, Barcode, GripVertical, ClipboardCheck, ShieldCheck, AlertTriangle, CalendarIcon, Archive, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const KANBAN_COLUMNS = [
  { status: "collected", label: "Recepção/Coleta", icon: TestTubes, color: "text-warning", bg: "bg-warning/10", border: "border-warning/30", headerBg: "bg-warning/15" },
  { status: "triaged", label: "Triagem", icon: FlaskConical, color: "text-info", bg: "bg-info/10", border: "border-info/30", headerBg: "bg-info/15" },
  { status: "processing", label: "Em Análise", icon: Microscope, color: "text-phase-analytical", bg: "bg-phase-analytical/10", border: "border-phase-analytical/30", headerBg: "bg-phase-analytical/15" },
  { status: "analyzed", label: "Analisadas", icon: BadgeCheck, color: "text-success", bg: "bg-success/10", border: "border-success/30", headerBg: "bg-success/15" },
];

const CONDITION_OPTIONS_DEFAULT = [
  { value: "de_acordo", label: "De acordo" },
  { value: "hemolisada", label: "Hemolisada" },
  { value: "insuficiente", label: "Insuficiente" },
  { value: "lipêmica", label: "Lipêmica" },
  { value: "coagulada", label: "Coagulada" },
  { value: "enviado_lab_apoio", label: "Enviado para Laboratório Apoio" },
];

const CONDITION_OPTIONS_FEZES = [
  { value: "de_acordo", label: "De acordo" },
  { value: "larvas_visiveis", label: "Amostra com Larvas Visíveis" },
  { value: "nao_coletada", label: "Amostra não coletada" },
  { value: "insuficiente", label: "Insuficiente" },
  { value: "enviado_lab_apoio", label: "Enviado para Laboratório Apoio" },
];

const CONDITION_OPTIONS_URINA = [
  { value: "de_acordo", label: "De acordo" },
  { value: "insuficiente", label: "Insuficiente" },
  { value: "hematuria_visual", label: "Hematúria Visual" },
  { value: "nao_coletado", label: "Não coletado" },
];

const getConditionOptions = (sampleType: string) => {
  const lower = (sampleType || "").toLowerCase();
  if (lower.includes("fezes") || lower.includes("feces")) return CONDITION_OPTIONS_FEZES;
  if (lower.includes("urina") || lower.includes("urine")) return CONDITION_OPTIONS_URINA;
  return CONDITION_OPTIONS_DEFAULT;
};

const SampleKanbanTab = () => {
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [draggedSampleId, setDraggedSampleId] = useState<string | null>(null);
  const [registerDialog, setRegisterDialog] = useState<{ open: boolean; sample: any | null }>({ open: false, sample: null });
  const [condition, setCondition] = useState("de_acordo");
  const [registerNotes, setRegisterNotes] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { role: userRole } = useUserRole();
  const isAdmin = userRole === "admin";

  const { data: samples = [], isLoading } = useQuery({
    queryKey: ["samples"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("samples")
        .select("*, orders(order_number, patients(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: dbConditions = [] } = useQuery({
    queryKey: ["sample-condition-options-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sample_condition_options")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const getDynamicConditionOptions = useMemo(() => {
    return (sampleType: string, sector: string) => {
      const materialConditions = dbConditions.filter(
        c => c.material.toLowerCase() === (sampleType || "").toLowerCase() &&
             (!c.sector || c.sector === sector)
      );
      if (materialConditions.length > 0) {
        return materialConditions.map(c => ({ value: c.condition_value, label: c.condition_label }));
      }
      return getConditionOptions(sampleType);
    };
  }, [dbConditions]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, previousStatus }: { id: string; status: string; previousStatus: string }) => {
      const { error } = await supabase.from("samples").update({ status }).eq("id", id);
      if (error) throw error;

      let performerName = "";
      if (user?.id) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).single();
        performerName = profile?.full_name || "";
      }

      await supabase.from("sample_tracking_events").insert({
        sample_id: id,
        event_type: "status_change",
        previous_status: previousStatus,
        new_status: status,
        performed_by: user?.id,
        performed_by_name: performerName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      queryClient.invalidateQueries({ queryKey: ["sample-tracking-events"] });
      toast.success("Status atualizado via Kanban");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atualizar status"),
  });

  const registerSampleMutation = useMutation({
    mutationFn: async ({ id, condition, notes }: { id: string; condition: string; notes: string }) => {
      const goToProcessing = condition === "de_acordo";
      const newStatus = goToProcessing ? "processing" : "triaged";

      const { error } = await supabase.from("samples").update({
        condition,
        status: newStatus,
      }).eq("id", id);
      if (error) throw error;

      let performerName = "";
      if (user?.id) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).single();
        performerName = profile?.full_name || "";
      }

      await supabase.from("sample_tracking_events").insert({
        sample_id: id,
        event_type: goToProcessing ? "registered" : "pending_admin_review",
        previous_status: "triaged",
        new_status: newStatus,
        performed_by: user?.id,
        performed_by_name: performerName,
        notes: `Condição: ${condition}${notes ? ` | Obs: ${notes}` : ""}`,
      });

      // Create non-conformity record for any condition that is not "de_acordo"
      if (!goToProcessing) {
        const conditionLabel = condition.replace(/_/g, " ");
        await supabase.from("sample_nonconformities").insert({
          sample_id: id,
          reason: conditionLabel,
          description: notes || `Condição da amostra: ${conditionLabel}`,
          severity: "media",
          reported_by: user?.id,
          reported_by_name: performerName,
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      queryClient.invalidateQueries({ queryKey: ["sample-tracking-events"] });
      if (variables.condition === "de_acordo") {
        toast.success("Amostra registrada e movida para análise");
      } else {
        toast.warning("Amostra registrada com pendência — aguarda aprovação do Administrador");
      }
      setRegisterDialog({ open: false, sample: null });
      setCondition("de_acordo");
      setRegisterNotes("");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao registrar amostra"),
  });

  const sectors = [...new Set(samples.map(s => s.sector).filter(Boolean))].sort();

  const filtered = samples.filter(s => {
    if (sectorFilter !== "all" && s.sector !== sectorFilter) return false;
    if (dateFilter) {
      const sampleDate = new Date(s.collected_at);
      if (sampleDate < startOfDay(dateFilter) || sampleDate > endOfDay(dateFilter)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const patientName = (s.orders as any)?.patients?.name || "";
      if (!patientName.toLowerCase().includes(q) && !s.barcode.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleDragStart = (e: React.DragEvent, sampleId: string) => {
    e.dataTransfer.setData("sampleId", sampleId);
    setDraggedSampleId(sampleId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const sampleId = e.dataTransfer.getData("sampleId");
    const sample = samples.find(s => s.id === sampleId);
    if (!sample || sample.status === targetStatus) {
      setDraggedSampleId(null);
      return;
    }

    // Block non-admin from moving samples with condition != "de_acordo" to processing/analyzed
    const sampleCondition = (sample as any).condition || "de_acordo";
    if (sampleCondition !== "de_acordo" && !isAdmin && (targetStatus === "processing" || targetStatus === "analyzed")) {
      toast.error("Amostra com condição pendente — somente Administrador pode liberar para análise");
      setDraggedSampleId(null);
      return;
    }

    updateStatusMutation.mutate({ id: sampleId, status: targetStatus, previousStatus: sample.status });
    setDraggedSampleId(null);
  };

  const handleDragEnd = () => setDraggedSampleId(null);

  const handleRegisterClick = (sample: any) => {
    setCondition("de_acordo");
    setRegisterNotes("");
    setRegisterDialog({ open: true, sample });
  };

  const handleConfirmRegister = () => {
    if (!registerDialog.sample) return;
    registerSampleMutation.mutate({
      id: registerDialog.sample.id,
      condition,
      notes: registerNotes,
    });
  };

  if (isLoading) {
    return <p className="text-center py-8 text-muted-foreground">Carregando Kanban...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold">Kanban de Amostras</h3>
          <p className="text-sm text-muted-foreground">Arraste as amostras entre colunas para alterar o status</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Buscar paciente ou código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-[200px]"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[180px] justify-start text-left font-normal", !dateFilter && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "dd/MM/yyyy", { locale: ptBR }) : "Filtrar por data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {dateFilter && (
            <Button variant="ghost" size="sm" onClick={() => setDateFilter(undefined)} className="text-xs">
              Limpar data
            </Button>
          )}
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os setores</SelectItem>
              {sectors.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[500px]">
        {KANBAN_COLUMNS.map(col => {
          const columnSamples = filtered.filter(s => s.status === col.status);
          return (
            <div
              key={col.status}
              className={cn("rounded-xl border-2 border-dashed p-2 transition-colors", col.border, col.bg)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, col.status)}
            >
              <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg mb-3", col.headerBg)}>
                <col.icon className={cn("w-5 h-5", col.color)} />
                <span className="font-semibold text-sm text-foreground">{col.label}</span>
                <Badge variant="secondary" className="ml-auto text-xs">{columnSamples.length}</Badge>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {columnSamples.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-8 italic">
                    Nenhuma amostra
                  </p>
                ) : (
                  columnSamples.map(sample => (
                    <Card
                      key={sample.id}
                      draggable
                      onDragStart={e => handleDragStart(e, sample.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "cursor-grab active:cursor-grabbing transition-all hover:shadow-md border",
                        draggedSampleId === sample.id && "opacity-50 scale-95",
                        (sample as any).condition && (sample as any).condition !== "de_acordo" && "border-l-4 border-l-warning",
                      )}
                    >
                      <CardContent className="p-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <Barcode className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="font-mono text-xs truncate">{sample.barcode}</span>
                          </div>
                        </div>
                        <p className="text-sm font-medium truncate pl-5">
                          {(sample.orders as any)?.patients?.name || "—"}
                        </p>
                        <div className="flex items-center gap-2 pl-5">
                          <Badge variant="outline" className="text-[10px] h-5">{sample.sector}</Badge>
                          <span className="text-[10px] text-muted-foreground">{sample.sample_type}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground pl-5">
                          {(sample.orders as any)?.order_number}
                        </p>

                        {/* Show condition badge when not "de_acordo" */}
                        {(sample as any).condition && (sample as any).condition !== "de_acordo" && (
                          <div className="pl-5 flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-warning" />
                            <span className="text-[10px] font-medium text-warning">
                              {(sample as any).condition.replace(/_/g, " ")}
                            </span>
                          </div>
                        )}

                        {col.status === "triaged" && (!(sample as any).condition || (sample as any).condition === "de_acordo") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2 text-xs gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegisterClick(sample);
                            }}
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            Registrar Amostra
                          </Button>
                        )}

                        {/* Admin approve button for samples with non-de_acordo condition */}
                        {col.status === "triaged" && (sample as any).condition && (sample as any).condition !== "de_acordo" && isAdmin && (
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full mt-2 text-xs gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatusMutation.mutate({ id: sample.id, status: "processing", previousStatus: sample.status });
                            }}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Aprovar e Enviar para Análise
                          </Button>
                        )}

                        {/* Non-admin sees pending message */}
                        {col.status === "triaged" && (sample as any).condition && (sample as any).condition !== "de_acordo" && !isAdmin && (
                          <p className="text-[10px] text-warning italic pl-5 mt-1">
                            Aguardando aprovação do Administrador
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog de Registro de Amostra */}
      <Dialog open={registerDialog.open} onOpenChange={(open) => !open && setRegisterDialog({ open: false, sample: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-info" />
              Registrar Amostra
            </DialogTitle>
            <DialogDescription>
              Confirme a condição da amostra antes de movê-la para análise.
            </DialogDescription>
          </DialogHeader>

          {registerDialog.sample && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{registerDialog.sample.barcode}</span>
                </div>
                <p className="text-sm font-medium">
                  {(registerDialog.sample.orders as any)?.patients?.name || "—"}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{registerDialog.sample.sector}</Badge>
                  <span className="text-xs text-muted-foreground">{registerDialog.sample.sample_type}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Condição da amostra</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getDynamicConditionOptions(registerDialog.sample?.sample_type || "", registerDialog.sample?.sector || "").map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea
                  value={registerNotes}
                  onChange={e => setRegisterNotes(e.target.value)}
                  placeholder="Adicione observações sobre a amostra..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterDialog({ open: false, sample: null })}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmRegister} disabled={registerSampleMutation.isPending}>
              {registerSampleMutation.isPending ? "Registrando..." : "Confirmar Registro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SampleKanbanTab;
