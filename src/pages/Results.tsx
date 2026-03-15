import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { CheckCircle, FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Results = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("results")
        .select("*, orders(order_number, patients(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("results").update({
        status: "validated",
        validated_at: new Date().toISOString(),
        analyst_id: user?.id,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      toast.success("Resultado validado!");
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("results").update({
        status: "released",
        released_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      toast.success("Laudo liberado!");
    },
  });

  const pending = results.filter(r => r.status === "pending");
  const validated = results.filter(r => r.status === "validated");
  const released = results.filter(r => r.status === "released");

  if (isLoading) {
    return <div className="p-6"><p className="text-muted-foreground">Carregando...</p></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resultados</h1>
        <p className="text-sm text-muted-foreground">Liberação e validação de laudos laboratoriais</p>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum resultado cadastrado ainda. Os resultados aparecerão aqui quando amostras forem processadas.
          </CardContent>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pendentes de Validação ({pending.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Exame</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Referência</TableHead>
                      <TableHead>Flag</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.map(result => (
                      <TableRow key={result.id}>
                        <TableCell className="font-mono text-sm">{(result.orders as any)?.order_number}</TableCell>
                        <TableCell>{(result.orders as any)?.patients?.name}</TableCell>
                        <TableCell>{result.exam}</TableCell>
                        <TableCell className="font-mono font-medium">{result.value} {result.unit}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{result.reference_range}</TableCell>
                        <TableCell><StatusBadge status={result.flag} /></TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => validateMutation.mutate(result.id)}>
                            <CheckCircle className="w-3 h-3 mr-1" /> Validar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {validated.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Validados — Aguardando Liberação ({validated.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Exame</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validated.map(result => (
                      <TableRow key={result.id}>
                        <TableCell className="font-mono text-sm">{(result.orders as any)?.order_number}</TableCell>
                        <TableCell>{(result.orders as any)?.patients?.name}</TableCell>
                        <TableCell>{result.exam}</TableCell>
                        <TableCell className="font-mono font-medium">{result.value} {result.unit}</TableCell>
                        <TableCell>
                          <Button size="sm" className="h-7 text-xs" onClick={() => releaseMutation.mutate(result.id)}>
                            <FileText className="w-3 h-3 mr-1" /> Liberar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {released.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Liberados ({released.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Exame</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Flag</TableHead>
                      <TableHead>Liberado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {released.map(result => (
                      <TableRow key={result.id}>
                        <TableCell className="font-mono text-sm">{(result.orders as any)?.order_number}</TableCell>
                        <TableCell>{(result.orders as any)?.patients?.name}</TableCell>
                        <TableCell>{result.exam}</TableCell>
                        <TableCell className="font-mono font-medium">{result.value} {result.unit}</TableCell>
                        <TableCell><StatusBadge status={result.flag} /></TableCell>
                        <TableCell className="text-sm">{result.released_at ? new Date(result.released_at).toLocaleString("pt-BR") : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Results;
