import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/StatusBadge";
import { Search, Barcode, Plus, TestTubes, Shield, ChevronDown, Calendar, FlaskConical, Microscope, BadgeCheck } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import SampleTrackingTab from "@/components/samples/SampleTrackingTab";
import NonConformityTab from "@/components/samples/NonConformityTab";
import TemperatureTab from "@/components/samples/TemperatureTab";
import ComplianceReportTab from "@/components/samples/ComplianceReportTab";
import SampleStatusStepper from "@/components/samples/SampleStatusStepper";
import SampleKanbanTab from "@/components/samples/SampleKanbanTab";

const SAMPLE_TYPES = ["Sangue", "Urina", "Soro", "Plasma"] as const;
const SECTORS = ["Hematologia", "Bioquímica", "Imunologia", "Microbiologia"] as const;

const SAMPLE_CONDITIONS_DEFAULT = [
  { value: "de_acordo", label: "De acordo para análise", color: "text-success" },
  { value: "hemolisada", label: "Amostra hemolisada", color: "text-warning" },
  { value: "insuficiente", label: "Amostra Insuficiente", color: "text-critical" },
  { value: "nao_coletou", label: "Paciente Não coletou", color: "text-destructive" },
] as const;

const SAMPLE_CONDITIONS_URINE = [
  { value: "de_acordo", label: "De acordo para análise", color: "text-success" },
  { value: "hematuria_visual", label: "Amostra com hematúria visual", color: "text-warning" },
  { value: "insuficiente", label: "Amostra Insuficiente", color: "text-critical" },
  { value: "nao_coletou", label: "Paciente Não coletou", color: "text-destructive" },
] as const;

const getConditionsForSector = (sector: string, material: string) => {
  const isUrine = material?.toLowerCase().includes("urina") || sector?.toLowerCase().includes("urinálise") || sector?.toLowerCase().includes("equ") || sector?.toLowerCase().includes("eas");
  return isUrine ? SAMPLE_CONDITIONS_URINE : SAMPLE_CONDITIONS_DEFAULT;
};

const ALL_CONDITIONS = [...SAMPLE_CONDITIONS_DEFAULT, ...SAMPLE_CONDITIONS_URINE];

const STATUS_FLOW = [
  { value: "collected", label: "Coletado" },
  { value: "triaged", label: "Triado" },
  { value: "processing", label: "Processando" },
  { value: "analyzed", label: "Analisado" },
] as const;

const Samples = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [open, setOpen] = useState(false);
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

  const { data: orders = [] } = useQuery({
    queryKey: ["orders-for-samples"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, exams, patients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: examCatalog = [] } = useQuery({
    queryKey: ["exam-catalog-for-samples"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_catalog")
        .select("name, sector, material")
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (items: { order_id: string; sample_type: string; sector: string }[]) => {
      const { error } = await supabase.from("samples").insert(
        items.map(item => ({ order_id: item.order_id, sample_type: item.sample_type, sector: item.sector, barcode: "" }))
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      setOpen(false);
      toast.success("Amostras registradas com sucesso!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao registrar amostras"),
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
      toast.success("Status atualizado");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atualizar status"),
  });

  const updateConditionMutation = useMutation({
    mutationFn: async ({ id, condition }: { id: string; condition: string }) => {
      const { error } = await supabase.from("samples").update({ condition } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      toast.success("Condição da amostra atualizada");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atualizar condição"),
  });

  // Filter by date and search
  const filteredByDate = useMemo(() => {
    return samples.filter(s => {
      const sampleDate = new Date(s.collected_at).toISOString().split("T")[0];
      return sampleDate === selectedDate;
    });
  }, [samples, selectedDate]);

  const filtered = useMemo(() => {
    let result = filteredByDate;
    if (statusFilter !== "all") {
      result = result.filter(s => s.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => {
        const patientName = (s.orders as any)?.patients?.name || "";
        return patientName.toLowerCase().includes(q) || s.barcode.includes(search);
      });
    }
    return result;
  }, [filteredByDate, search, statusFilter]);

  // Group by sector
  const groupedBySector = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const s of filtered) {
      const sector = s.sector || "Sem Setor";
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(s);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  // Status summary counts
  const statusCounts = useMemo(() => {
    const counts = { collected: 0, triaged: 0, processing: 0, analyzed: 0 };
    for (const s of filtered) {
      if (s.status in counts) counts[s.status as keyof typeof counts]++;
    }
    return counts;
  }, [filtered]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Amostras
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
              <Shield className="w-3 h-3" />
              RDC 978/2025
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">Rastreamento, triagem e controle de qualidade de amostras biológicas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Registrar Amostras</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Registrar Amostras</DialogTitle></DialogHeader>
            <SampleForm orders={orders} examCatalog={examCatalog} onSubmit={items => createMutation.mutate(items)} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Coletadas", count: statusCounts.collected, value: "collected", icon: TestTubes, color: "text-warning", bg: "bg-warning/10 border-warning/20", activeBg: "bg-warning/25 border-warning/50 ring-2 ring-warning/30" },
          { label: "Triadas", count: statusCounts.triaged, value: "triaged", icon: FlaskConical, color: "text-info", bg: "bg-info/10 border-info/20", activeBg: "bg-info/25 border-info/50 ring-2 ring-info/30" },
          { label: "Em Análise", count: statusCounts.processing, value: "processing", icon: Microscope, color: "text-phase-analytical", bg: "bg-phase-analytical/10 border-phase-analytical/20", activeBg: "bg-phase-analytical/25 border-phase-analytical/50 ring-2 ring-phase-analytical/30" },
          { label: "Analisadas", count: statusCounts.analyzed, value: "analyzed", icon: BadgeCheck, color: "text-success", bg: "bg-success/10 border-success/20", activeBg: "bg-success/25 border-success/50 ring-2 ring-success/30" },
        ].map(card => (
          <Card
            key={card.value}
            className={cn(
              "border cursor-pointer transition-all hover:shadow-md",
              statusFilter === card.value ? card.activeBg : card.bg,
            )}
            onClick={() => setStatusFilter(prev => prev === card.value ? "all" : card.value)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <card.icon className={cn("w-8 h-8", card.color)} />
              <div>
                <p className="text-2xl font-bold text-foreground">{card.count}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Legenda do fluxo */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
        <span className="font-medium">Fluxo:</span>
        <span className="inline-flex items-center gap-1"><TestTubes className="w-3.5 h-3.5 text-warning" />Coleta</span>
        <span>→</span>
        <span className="inline-flex items-center gap-1"><FlaskConical className="w-3.5 h-3.5 text-info" />Triagem</span>
        <span>→</span>
        <span className="inline-flex items-center gap-1"><Microscope className="w-3.5 h-3.5 text-phase-analytical" />Análise</span>
        <span>→</span>
        <span className="inline-flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-success" />Concluída</span>
      </div>
      {statusFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrando por:</span>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setStatusFilter("all")}>
            {STATUS_FLOW.find(s => s.value === statusFilter)?.label || statusFilter}
            <span className="ml-1">×</span>
          </Button>
        </div>
      )}

      <Tabs defaultValue="amostras" className="space-y-4">
        <TabsList>
          <TabsTrigger value="amostras">Amostras</TabsTrigger>
          <TabsTrigger value="rastreabilidade">Rastreabilidade</TabsTrigger>
          <TabsTrigger value="nao-conformidades">Não-Conformidades</TabsTrigger>
          <TabsTrigger value="temperatura">Temperatura</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório RDC</TabsTrigger>
        </TabsList>

        <TabsContent value="amostras">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar por código de barras ou paciente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-40" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {filtered.length} amostra{filtered.length !== 1 ? "s" : ""} em {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR")}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TestTubes className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>Nenhuma amostra encontrada para {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedBySector.map(([sector, sectorSamples]) => (
                    <div key={sector}>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                        <TestTubes className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-sm text-foreground">{sector}</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {sectorSamples.length}
                        </span>
                      </div>
                      <Table>
                         <TableHeader>
                          <TableRow>
                            <TableHead>Código de Barras</TableHead>
                            <TableHead>Pedido</TableHead>
                            <TableHead>Paciente</TableHead>
                            <TableHead>Material</TableHead>
                            <TableHead>Condição</TableHead>
                            <TableHead>Progresso</TableHead>
                            <TableHead>Coleta</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sectorSamples.map(sample => (
                            <TableRow key={sample.id} className={cn(
                              (sample as any).is_rejected && "bg-destructive/5",
                              !((sample as any).is_rejected) && (sample as any).condition && (sample as any).condition !== "de_acordo" && "bg-warning/5 border-l-2 border-l-warning",
                            )}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Barcode className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-mono text-sm">{sample.barcode}</span>
                                  {(sample as any).is_rejected && (
                                    <span className="text-xs text-destructive font-medium">REJEITADA</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">{(sample.orders as any)?.order_number}</TableCell>
                              <TableCell>{(sample.orders as any)?.patients?.name}</TableCell>
                              <TableCell className="text-sm">{sample.sample_type}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className={cn("h-7 text-xs gap-1", getConditionsForSector(sample.sector, sample.sample_type).find(c => c.value === ((sample as any).condition || "de_acordo"))?.color || ALL_CONDITIONS.find(c => c.value === ((sample as any).condition || "de_acordo"))?.color)}>
                                      {getConditionsForSector(sample.sector, sample.sample_type).find(c => c.value === ((sample as any).condition || "de_acordo"))?.label || ALL_CONDITIONS.find(c => c.value === ((sample as any).condition || "de_acordo"))?.label || "De acordo"}
                                      <ChevronDown className="w-3 h-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    {getConditionsForSector(sample.sector, sample.sample_type).map(cond => (
                                      <DropdownMenuItem
                                        key={cond.value}
                                        className={cn("text-xs", cond.color)}
                                        onClick={() => updateConditionMutation.mutate({ id: sample.id, condition: cond.value })}
                                      >
                                        {cond.label}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                              <TableCell>
                                <SampleStatusStepper
                                  status={sample.status}
                                  compact
                                  onStatusChange={(newStatus, prevStatus) =>
                                    updateStatusMutation.mutate({ id: sample.id, status: newStatus, previousStatus: prevStatus })
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-sm">{new Date(sample.collected_at).toLocaleString("pt-BR")}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rastreabilidade">
          <Card>
            <CardContent className="pt-6">
              <SampleTrackingTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nao-conformidades">
          <Card>
            <CardContent className="pt-6">
              <NonConformityTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temperatura">
          <Card>
            <CardContent className="pt-6">
              <TemperatureTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorio">
          <Card>
            <CardContent className="pt-6">
              <ComplianceReportTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface SampleItem {
  sample_type: string;
  sector: string;
  exams: string[];
  condition: string;
}

const SampleForm = ({
  orders,
  examCatalog,
  onSubmit,
  loading,
}: {
  orders: any[];
  examCatalog: any[];
  onSubmit: (items: { order_id: string; sample_type: string; sector: string }[]) => void;
  loading: boolean;
}) => {
  const [orderId, setOrderId] = useState("");
  const [items, setItems] = useState<SampleItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedOrder = orders.find(o => o.id === orderId);

  const handleOrderChange = (id: string) => {
    setOrderId(id);
    setErrors(e => { const n = { ...e }; delete n.order; return n; });

    const order = orders.find(o => o.id === id);
    if (order && order.exams?.length > 0) {
      const catalogMap = new Map<string, { sector: string; material: string }>();
      for (const ec of examCatalog) {
        catalogMap.set(ec.name, { sector: ec.sector || "Bioquímica", material: ec.material || "Sangue" });
      }

      // Group exams by sector
      const sectorMap = new Map<string, { material: string; exams: string[] }>();
      for (const examName of order.exams) {
        const info = catalogMap.get(examName);
        const sector = info?.sector || "Bioquímica";
        const material = info?.material || "Sangue";
        if (!sectorMap.has(sector)) {
          sectorMap.set(sector, { material, exams: [] });
        }
        sectorMap.get(sector)!.exams.push(examName);
      }

      if (sectorMap.size > 0) {
        const autoItems: SampleItem[] = Array.from(sectorMap.entries()).map(([sector, info]) => ({
          sample_type: info.material,
          sector,
          exams: info.exams,
          condition: "de_acordo",
        }));
        setItems(autoItems);
        return;
      }
    }
    setItems([]);
  };

  const updateCondition = (index: number, value: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, condition: value } : item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!orderId) newErrors.order = "Selecione um pedido";
    if (items.length === 0) newErrors.items = "Selecione um pedido com exames";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    onSubmit(items.map(item => ({ order_id: orderId, sample_type: item.sample_type, sector: item.sector })));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Pedido <span className="text-destructive">*</span></Label>
        <Select value={orderId} onValueChange={handleOrderChange}>
          <SelectTrigger className={errors.order ? "border-destructive" : ""}>
            <SelectValue placeholder="Selecionar pedido" />
          </SelectTrigger>
          <SelectContent>
            {orders.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhum pedido disponível</div>
            ) : (
              orders.map(o => (
                <SelectItem key={o.id} value={o.id}>
                  <span className="font-mono">{o.order_number}</span>
                  <span className="text-muted-foreground ml-2">— {(o.patients as any)?.name}</span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {errors.order && <p className="text-xs text-destructive">{errors.order}</p>}
      </div>

      {selectedOrder && (
        <div className="rounded-md bg-muted/50 p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Paciente: <span className="text-foreground">{(selectedOrder.patients as any)?.name}</span></p>
          <p className="text-xs font-medium text-muted-foreground">Total de Exames: <span className="text-foreground">{selectedOrder.exams?.length || 0}</span></p>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          <Label>Tubos por Setor</Label>
          {items.map((item, index) => (
            <div key={index} className="rounded-md border bg-card p-3 space-y-2">
              <div className="flex items-center gap-2">
                <TestTubes className="w-4 h-4 text-primary shrink-0" />
                <span className="font-semibold text-sm text-foreground">{item.sector}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-auto">{item.sample_type}</span>
              </div>

              <div className="pl-6 space-y-1.5">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Exames:</p>
                  <div className="flex flex-wrap gap-1">
                    {item.exams.map((exam, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                        {exam}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">Condição:</p>
                  <Select value={item.condition} onValueChange={v => updateCondition(index, v)}>
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getConditionsForSector(item.sector, item.sample_type).map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          <span className={c.color}>{c.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Barcode className="w-3.5 h-3.5" />
            Códigos de barras serão gerados automaticamente para cada tubo
          </p>
        </div>
      )}

      {items.length === 0 && orderId && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <TestTubes className="w-6 h-6 mx-auto mb-2 opacity-40" />
          Nenhum exame encontrado neste pedido
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading || !orderId || items.length === 0}>
        {loading ? "Registrando..." : `Registrar ${items.length} Amostra${items.length !== 1 ? "s" : ""}`}
      </Button>
    </form>
  );
};

export default Samples;
