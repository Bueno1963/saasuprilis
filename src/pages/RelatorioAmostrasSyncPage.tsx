import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ArrowDownUp, CheckCircle2, XCircle, Clock } from "lucide-react";

const RelatorioAmostrasSyncPage = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["sync-logs-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_sync_logs")
        .select("*, integrations(name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const totalSuccess = logs.filter((l) => l.status === "success").length;
  const totalError = logs.filter((l) => l.status === "error").length;
  const totalRecordsCreated = logs.reduce((s, l) => s + (l.records_created || 0), 0);
  const totalRecordsUpdated = logs.reduce((s, l) => s + (l.records_updated || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Relatório de Amostras Sincronizadas
        </h1>
        <p className="text-sm text-muted-foreground">
          Histórico de sincronizações entre o LIS e equipamentos integrados
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Total Syncs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{logs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{totalSuccess}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <XCircle className="h-3 w-3 text-destructive" /> Erros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{totalError}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <ArrowDownUp className="h-3 w-3 text-primary" /> Registros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{totalRecordsCreated + totalRecordsUpdated}</p>
            <p className="text-[10px] text-muted-foreground">{totalRecordsCreated} criados · {totalRecordsUpdated} atualizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Direção</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead className="text-right">Criados</TableHead>
                <TableHead className="text-right">Atualizados</TableHead>
                <TableHead className="text-right">Falhas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">Carregando...</TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Nenhuma sincronização registrada
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {(log as any).integrations?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {log.direction === "outbound" ? "⬆ Envio" : "⬇ Recebimento"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.status === "success" ? "default" : "destructive"} className="text-xs">
                        {log.status === "success" ? "Sucesso" : "Erro"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">
                      {log.error_message || log.message || "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">{log.records_created}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{log.records_updated}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-destructive">{log.records_failed}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatorioAmostrasSyncPage;
