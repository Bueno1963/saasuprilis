import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Unlock, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const LiberarExames = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["results-validated"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("results")
        .select("*, orders(order_number, patients(name))")
        .eq("status", "validated")
        .order("validated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("results").update({
        status: "released",
        released_at: new Date().toISOString(),
        analyst_id: user?.id,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results-validated"] });
      toast.success("Exame liberado com sucesso");
    },
    onError: () => toast.error("Erro ao liberar exame"),
  });

  const releaseAll = useMutation({
    mutationFn: async () => {
      const ids = results.map((r: any) => r.id);
      if (ids.length === 0) return;
      const { error } = await supabase.from("results").update({
        status: "released",
        released_at: new Date().toISOString(),
        analyst_id: user?.id,
      }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results-validated"] });
      toast.success("Todos os exames foram liberados");
    },
    onError: () => toast.error("Erro ao liberar exames"),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liberar Exames</h1>
          <p className="text-sm text-muted-foreground">Exames validados aguardando liberação para laudo</p>
        </div>
        {results.length > 0 && (
          <Button onClick={() => releaseAll.mutate()} disabled={releaseAll.isPending}>
            <CheckCircle className="w-4 h-4 mr-2" /> Liberar Todos ({results.length})
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{results.length} exame{results.length !== 1 ? "s" : ""} validado{results.length !== 1 ? "s" : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : results.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Unlock className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Nenhum exame validado pendente de liberação</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Exame</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{(r.orders as any)?.order_number}</TableCell>
                    <TableCell className="font-medium">{(r.orders as any)?.patients?.name}</TableCell>
                    <TableCell>{r.exam}</TableCell>
                    <TableCell className="font-mono font-semibold">{r.value} {r.unit}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => releaseMutation.mutate(r.id)} disabled={releaseMutation.isPending}>
                        <Unlock className="w-3.5 h-3.5 mr-1" /> Liberar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiberarExames;
