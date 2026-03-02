import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MapPin, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EVENT_TYPE_LABELS: Record<string, string> = {
  status_change: "Mudança de Status",
  collection: "Coleta",
  transport: "Transporte",
  storage: "Armazenamento",
  disposal: "Descarte",
  rejection: "Rejeição",
  temperature_check: "Verificação de Temperatura",
  nonconformity: "Não-conformidade",
};

const SampleTrackingTab = () => {
  const [sampleFilter, setSampleFilter] = useState<string>("all");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["sample-tracking-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sample_tracking_events")
        .select("*, samples(barcode, sample_type, orders(order_number, patients(name)))")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: samples = [] } = useQuery({
    queryKey: ["samples-for-tracking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("samples")
        .select("id, barcode")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const filtered = sampleFilter === "all" 
    ? events 
    : events.filter((e: any) => e.sample_id === sampleFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Cadeia de Custódia</h3>
          <p className="text-sm text-muted-foreground">Rastreabilidade completa de todas as amostras — RDC 978/2025</p>
        </div>
        <Select value={sampleFilter} onValueChange={setSampleFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrar por amostra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as amostras</SelectItem>
            {samples.map((s: any) => (
              <SelectItem key={s.id} value={s.id}>
                <span className="font-mono text-xs">{s.barcode}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Carregando histórico...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum evento de rastreabilidade registrado</p>
          <p className="text-xs mt-1">Os eventos são registrados automaticamente quando o status de uma amostra é alterado</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Amostra</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Transição</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((event: any) => (
              <TableRow key={event.id}>
                <TableCell className="text-xs font-mono whitespace-nowrap">
                  {new Date(event.created_at).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {(event.samples as any)?.barcode}
                </TableCell>
                <TableCell className="text-sm">
                  {(event.samples as any)?.orders?.patients?.name || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {event.previous_status && event.new_status ? (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="capitalize">{event.previous_status}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="capitalize font-medium">{event.new_status}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-xs">
                    <User className="w-3 h-3 text-muted-foreground" />
                    {event.performed_by_name || "Sistema"}
                  </div>
                </TableCell>
                <TableCell>
                  {event.location ? (
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      {event.location}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                  {event.notes || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default SampleTrackingTab;
