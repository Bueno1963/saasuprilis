import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/StatusBadge";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const PedidosIncompletos = () => {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders-incomplete"],
    queryFn: async () => {
      // Orders that are not fully released
      const { data, error } = await supabase
        .from("orders")
        .select("*, patients(name, cpf), results(id, exam, status)")
        .in("status", ["registered", "collected", "in_progress"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Filter orders that have at least one result not released
  const incomplete = orders.filter((o: any) => {
    const results = o.results || [];
    return results.length === 0 || results.some((r: any) => r.status !== "released");
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatório de Pedidos Incompletos</h1>
        <p className="text-sm text-muted-foreground">Pedidos com exames pendentes de resultado ou liberação</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{incomplete.length} pedido{incomplete.length !== 1 ? "s" : ""} incompleto{incomplete.length !== 1 ? "s" : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : incomplete.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <AlertTriangle className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Nenhum pedido incompleto encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Exames Liberados</TableHead>
                  <TableHead>Exames Pendentes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomplete.map((o: any) => {
                  const results = o.results || [];
                  const releasedExams = results.filter((r: any) => r.status === "released");
                  const pendingExams = results.filter((r: any) => r.status !== "released");
                  // Exams requested but without any result entry yet
                  const examsWithResults = new Set(results.map((r: any) => r.exam));
                  const missingExams = (o.exams || []).filter((e: string) => !examsWithResults.has(e));

                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                      <TableCell className="font-medium">{(o.patients as any)?.name}</TableCell>
                      <TableCell><StatusBadge status={o.status} /></TableCell>
                      <TableCell>
                        {releasedExams.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {releasedExams.map((r: any) => (
                              <Badge key={r.id} variant="outline" className="text-xs gap-1 border-green-300 text-green-700 bg-green-50">
                                <CheckCircle2 className="h-3 w-3" />
                                {r.exam}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Nenhum</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {pendingExams.map((r: any) => (
                            <Badge key={r.id} variant="outline" className="text-xs gap-1 border-amber-300 text-amber-700 bg-amber-50">
                              <Clock className="h-3 w-3" />
                              {r.exam}
                            </Badge>
                          ))}
                          {missingExams.map((exam: string) => (
                            <Badge key={exam} variant="outline" className="text-xs gap-1 border-destructive/30 text-destructive bg-destructive/5">
                              <AlertTriangle className="h-3 w-3" />
                              {exam}
                            </Badge>
                          ))}
                          {pendingExams.length === 0 && missingExams.length === 0 && (
                            <span className="text-muted-foreground text-xs">Nenhum</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PedidosIncompletos;
