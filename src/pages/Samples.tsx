import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/StatusBadge";
import { Search, Barcode, Plus, TestTubes, Shield, ChevronDown } from "lucide-react";
import { useState } from "react";
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

const SAMPLE_TYPES = ["Sangue", "Urina", "Soro", "Plasma"] as const;
const SECTORS = ["Hematologia", "Bioquímica", "Imunologia", "Microbiologia"] as const;

const STATUS_FLOW = [
  { value: "collected", label: "Coletado" },
  { value: "triaged", label: "Triado" },
  { value: "processing", label: "Processando" },
  { value: "analyzed", label: "Analisado" },
] as const;

const Samples = () => {
  const [search, setSearch] = useState("");
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

      // Log tracking event for RDC 978 compliance
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

  const filtered = samples.filter(s => {
    const patientName = (s.orders as any)?.patients?.name || "";
    return patientName.toLowerCase().includes(search.toLowerCase()) || s.barcode.includes(search);
  });

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
            <SampleForm orders={orders} onSubmit={items => createMutation.mutate(items)} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="amostras" className="space-y-4">
        <TabsList>
          <TabsTrigger value="amostras">Amostras</TabsTrigger>
          <TabsTrigger value="rastreabilidade">Rastreabilidade</TabsTrigger>
          <TabsTrigger value="nao-conformidades">Não-Conformidades</TabsTrigger>
          <TabsTrigger value="temperatura">Temperatura</TabsTrigger>
        </TabsList>

        <TabsContent value="amostras">
          <Card>
            <CardHeader className="pb-3">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por código de barras ou paciente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : filtered.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhuma amostra encontrada</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código de Barras</TableHead>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Coleta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(sample => (
                      <TableRow key={sample.id} className={(sample as any).is_rejected ? "bg-destructive/5" : ""}>
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
                        <TableCell className="text-sm">{sample.sector}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                                <StatusBadge status={sample.status} />
                                <ChevronDown className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {STATUS_FLOW.map(s => (
                                <DropdownMenuItem
                                  key={s.value}
                                  disabled={sample.status === s.value}
                                  onClick={() => updateStatusMutation.mutate({ id: sample.id, status: s.value, previousStatus: sample.status })}
                                  className={sample.status === s.value ? "font-semibold" : ""}
                                >
                                  <StatusBadge status={s.value} />
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="text-sm">{new Date(sample.collected_at).toLocaleString("pt-BR")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
      </Tabs>
    </div>
  );
};

interface SampleItem {
  sample_type: string;
  sector: string;
}

const SampleForm = ({
  orders,
  onSubmit,
  loading,
}: {
  orders: any[];
  onSubmit: (items: { order_id: string; sample_type: string; sector: string }[]) => void;
  loading: boolean;
}) => {
  const [orderId, setOrderId] = useState("");
  const [items, setItems] = useState<SampleItem[]>([{ sample_type: "Sangue", sector: "Hematologia" }]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedOrder = orders.find(o => o.id === orderId);

  const addItem = () => {
    setItems(prev => [...prev, { sample_type: "Sangue", sector: "Hematologia" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof SampleItem, value: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!orderId) newErrors.order = "Selecione um pedido";
    if (items.length === 0) newErrors.items = "Adicione pelo menos uma amostra";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(items.map(item => ({ order_id: orderId, ...item })));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Pedido <span className="text-destructive">*</span></Label>
        <Select value={orderId} onValueChange={v => { setOrderId(v); setErrors(e => { const n = { ...e }; delete n.order; return n; }); }}>
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
          <p className="text-xs font-medium text-muted-foreground">Exames: <span className="text-foreground">{selectedOrder.exams?.join(", ")}</span></p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Tubos / Amostras <span className="text-destructive">*</span></Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Adicionar Tubo
          </Button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2 p-3 rounded-md border bg-card">
            <TestTubes className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 grid grid-cols-2 gap-2">
              <Select value={item.sample_type} onValueChange={v => updateItem(index, "sample_type", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SAMPLE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={item.sector} onValueChange={v => updateItem(index, "sector", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {items.length > 1 && (
              <button type="button" onClick={() => removeItem(index)} className="text-muted-foreground hover:text-destructive transition-colors text-sm px-1">×</button>
            )}
          </div>
        ))}

        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Barcode className="w-3.5 h-3.5" />
          Códigos de barras serão gerados automaticamente para cada tubo
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading || !orderId}>
        {loading ? "Registrando..." : `Registrar ${items.length} Amostra${items.length > 1 ? "s" : ""}`}
      </Button>
    </form>
  );
};

export default Samples;
