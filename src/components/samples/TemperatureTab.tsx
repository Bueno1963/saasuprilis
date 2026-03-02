import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Thermometer, Plus, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const TemperatureTab = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["sample-temperature-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sample_temperature_logs")
        .select("*, samples(barcode, sample_type, orders(order_number, patients(name)))")
        .order("recorded_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: samples = [] } = useQuery({
    queryKey: ["samples-for-temp"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("samples")
        .select("id, barcode, sample_type")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const outOfRangeCount = logs.filter((l: any) => !l.is_within_range).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Controle de Temperatura
            {outOfRangeCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {outOfRangeCount} desvio{outOfRangeCount > 1 ? "s" : ""}
              </Badge>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">Monitoramento de condições de transporte e armazenamento — RDC 978/2025</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />Registrar Temperatura</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Registrar Temperatura</DialogTitle></DialogHeader>
            <TemperatureForm
              samples={samples}
              userId={user?.id}
              onSuccess={() => {
                setOpen(false);
                queryClient.invalidateQueries({ queryKey: ["sample-temperature-logs"] });
                queryClient.invalidateQueries({ queryKey: ["sample-tracking-events"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Carregando...</p>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Thermometer className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum registro de temperatura</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Amostra</TableHead>
              <TableHead>Temperatura</TableHead>
              <TableHead>Faixa Aceitável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Condição</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log: any) => (
              <TableRow key={log.id} className={log.is_within_range ? "" : "bg-destructive/5"}>
                <TableCell className="text-xs font-mono whitespace-nowrap">
                  {new Date(log.recorded_at).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="font-mono text-xs">{(log.samples as any)?.barcode}</TableCell>
                <TableCell>
                  <span className={`font-semibold text-sm ${log.is_within_range ? "text-success" : "text-critical"}`}>
                    {log.temperature_celsius}°C
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {log.min_acceptable}°C — {log.max_acceptable}°C
                </TableCell>
                <TableCell>
                  {log.is_within_range ? (
                    <Badge className="bg-success/15 text-success text-xs">Conforme</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">Desvio</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs capitalize">{log.transport_condition}</TableCell>
                <TableCell className="text-xs">{log.location || "—"}</TableCell>
                <TableCell className="text-xs">{log.recorded_by_name || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{log.notes || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

const TemperatureForm = ({ samples, userId, onSuccess }: { samples: any[]; userId?: string; onSuccess: () => void }) => {
  const [sampleId, setSampleId] = useState("");
  const [temperature, setTemperature] = useState("");
  const [minTemp, setMinTemp] = useState("2");
  const [maxTemp, setMaxTemp] = useState("8");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("refrigerado");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sampleId || !temperature) return;
    setLoading(true);

    try {
      let recorderName = "";
      if (userId) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", userId).single();
        recorderName = profile?.full_name || "";
      }

      const temp = parseFloat(temperature);
      const min = parseFloat(minTemp);
      const max = parseFloat(maxTemp);
      const withinRange = temp >= min && temp <= max;

      const { error } = await supabase.from("sample_temperature_logs").insert({
        sample_id: sampleId,
        temperature_celsius: temp,
        min_acceptable: min,
        max_acceptable: max,
        is_within_range: withinRange,
        location,
        transport_condition: condition,
        recorded_by: userId,
        recorded_by_name: recorderName,
        notes,
      });
      if (error) throw error;

      // Log tracking event
      await supabase.from("sample_tracking_events").insert({
        sample_id: sampleId,
        event_type: "temperature_check",
        performed_by: userId,
        performed_by_name: recorderName,
        location,
        notes: `Temperatura: ${temp}°C ${withinRange ? "(conforme)" : "(DESVIO)"}`,
      });

      toast.success(withinRange ? "Temperatura registrada — conforme" : "Temperatura registrada — DESVIO detectado!", {
        style: withinRange ? undefined : { background: "hsl(var(--destructive))", color: "white" },
      });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Amostra <span className="text-destructive">*</span></Label>
        <Select value={sampleId} onValueChange={setSampleId}>
          <SelectTrigger><SelectValue placeholder="Selecionar amostra" /></SelectTrigger>
          <SelectContent>
            {samples.map((s: any) => (
              <SelectItem key={s.id} value={s.id}>
                <span className="font-mono text-xs">{s.barcode}</span> — {s.sample_type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Temperatura (°C) <span className="text-destructive">*</span></Label>
          <Input type="number" step="0.1" value={temperature} onChange={e => setTemperature(e.target.value)} placeholder="Ex: 4.5" />
        </div>
        <div>
          <Label>Mín. aceitável</Label>
          <Input type="number" step="0.1" value={minTemp} onChange={e => setMinTemp(e.target.value)} />
        </div>
        <div>
          <Label>Máx. aceitável</Label>
          <Input type="number" step="0.1" value={maxTemp} onChange={e => setMaxTemp(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Condição de Transporte</Label>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="refrigerado">Refrigerado</SelectItem>
              <SelectItem value="congelado">Congelado</SelectItem>
              <SelectItem value="temperatura_ambiente">Temperatura Ambiente</SelectItem>
              <SelectItem value="gelo_seco">Gelo Seco</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Local</Label>
          <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Sala de triagem" />
        </div>
      </div>
      <div>
        <Label>Observações</Label>
        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações adicionais..." />
      </div>
      <Button type="submit" className="w-full" disabled={loading || !sampleId || !temperature}>
        {loading ? "Registrando..." : "Registrar Temperatura"}
      </Button>
    </form>
  );
};

export default TemperatureTab;
