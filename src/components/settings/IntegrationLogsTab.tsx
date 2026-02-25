import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, CheckCircle2, XCircle, Loader2, ArrowDownLeft, ArrowUpRight, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface Props {
  integrationId: string | null;
  lastSync: string | null | undefined;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  success: { label: "Sucesso", icon: CheckCircle2, variant: "default" },
  error: { label: "Erro", icon: XCircle, variant: "destructive" },
  in_progress: { label: "Em andamento", icon: Loader2, variant: "secondary" },
  partial: { label: "Parcial", icon: AlertTriangle, variant: "outline" },
};

const directionConfig: Record<string, { label: string; icon: React.ElementType }> = {
  inbound: { label: "Entrada", icon: ArrowDownLeft },
  outbound: { label: "Saída", icon: ArrowUpRight },
};

const IntegrationLogsTab = ({ integrationId, lastSync }: Props) => {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["integration-sync-logs", integrationId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("integration_sync_logs" as any)
        .select("*")
        .eq("integration_id", integrationId!)
        .order("created_at", { ascending: false })
        .limit(50);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!integrationId,
  });

  if (!integrationId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12 text-muted-foreground text-sm">
            Salve a integração primeiro para visualizar logs.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Histórico de Sincronização</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Registros de comunicação, envio e recebimento de mensagens
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastSync && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Clock className="h-3 w-3" />
                Última sync: {format(new Date(lastSync), "dd/MM/yyyy HH:mm")}
              </Badge>
            )}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary cards */}
        {logs.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border">
            <SummaryCard label="Total de Syncs" value={logs.length} />
            <SummaryCard label="Sucesso" value={logs.filter((l: any) => l.status === "success").length} color="text-success" />
            <SummaryCard label="Erros" value={logs.filter((l: any) => l.status === "error").length} color="text-critical" />
            <SummaryCard
              label="Registros Processados"
              value={logs.reduce((acc: number, l: any) => acc + (l.records_created || 0) + (l.records_updated || 0), 0)}
            />
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Nenhum log registrado ainda para esta integração.</p>
            <p className="text-xs text-muted-foreground">
              Os logs de comunicação (envio/recebimento de mensagens, erros, timeouts) serão exibidos aqui após a primeira sincronização.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Data / Hora</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[90px]">Direção</TableHead>
                <TableHead>Origem → Destino</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead className="w-[120px]">Registros</TableHead>
                <TableHead className="w-[80px]">Duração</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => {
                const sc = statusConfig[log.status] || statusConfig.success;
                const dc = directionConfig[log.direction] || directionConfig.inbound;
                const StatusIcon = sc.icon;
                const DirIcon = dc.icon;

                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sc.variant} className="gap-1 text-xs">
                        <StatusIcon className="h-3 w-3" />
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <DirIcon className="h-3 w-3" />
                        {dc.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="text-foreground">{log.source_system || "—"}</span>
                      <span className="text-muted-foreground mx-1">→</span>
                      <span className="text-foreground">{log.destination_system || "—"}</span>
                    </TableCell>
                    <TableCell className="text-xs max-w-[250px]">
                      <p className="truncate text-foreground">{log.message}</p>
                      {log.error_message && (
                        <p className="truncate text-critical text-[11px] mt-0.5">{log.error_message}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="space-y-0.5">
                        {log.records_created > 0 && <span className="block text-success">+{log.records_created} criados</span>}
                        {log.records_updated > 0 && <span className="block text-info">~{log.records_updated} atualiz.</span>}
                        {log.records_failed > 0 && <span className="block text-critical">✕{log.records_failed} falhas</span>}
                        {log.records_created === 0 && log.records_updated === 0 && log.records_failed === 0 && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.duration_ms ? `${log.duration_ms}ms` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

const SummaryCard = ({ label, value, color }: { label: string; value: number; color?: string }) => (
  <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
    <p className={`text-lg font-bold ${color || "text-foreground"}`}>{value}</p>
    <p className="text-[11px] text-muted-foreground">{label}</p>
  </div>
);

export default IntegrationLogsTab;
