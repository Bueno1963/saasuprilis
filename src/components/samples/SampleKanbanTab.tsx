import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestTubes, FlaskConical, Microscope, BadgeCheck, Barcode, GripVertical } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const KANBAN_COLUMNS = [
  { status: "collected", label: "Coletadas", icon: TestTubes, color: "text-warning", bg: "bg-warning/10", border: "border-warning/30", headerBg: "bg-warning/15" },
  { status: "triaged", label: "Triadas", icon: FlaskConical, color: "text-info", bg: "bg-info/10", border: "border-info/30", headerBg: "bg-info/15" },
  { status: "processing", label: "Em Análise", icon: Microscope, color: "text-phase-analytical", bg: "bg-phase-analytical/10", border: "border-phase-analytical/30", headerBg: "bg-phase-analytical/15" },
  { status: "analyzed", label: "Analisadas", icon: BadgeCheck, color: "text-success", bg: "bg-success/10", border: "border-success/30", headerBg: "bg-success/15" },
];

const SampleKanbanTab = () => {
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [draggedSampleId, setDraggedSampleId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

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

  const sectors = [...new Set(samples.map(s => s.sector).filter(Boolean))].sort();

  const filtered = samples.filter(s => {
    if (sectorFilter !== "all" && s.sector !== sectorFilter) return false;
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
    updateStatusMutation.mutate({ id: sampleId, status: targetStatus, previousStatus: sample.status });
    setDraggedSampleId(null);
  };

  const handleDragEnd = () => setDraggedSampleId(null);

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
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SampleKanbanTab;
