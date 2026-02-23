import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";

const sectors = ["Hematologia", "Bioquímica", "Imunologia", "Microbiologia"] as const;

const Worklist = () => {
  const { data: samples = [], isLoading } = useQuery({
    queryKey: ["samples"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("samples")
        .select("*, orders(order_number, patients(name))")
        .order("collected_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mapa de Trabalho</h1>
        <p className="text-sm text-muted-foreground">Organização de amostras por setor e equipamento</p>
      </div>

      <Tabs defaultValue="Hematologia">
        <TabsList>
          {sectors.map(sector => (
            <TabsTrigger key={sector} value={sector}>{sector}</TabsTrigger>
          ))}
        </TabsList>

        {sectors.map(sector => {
          const sectorSamples = samples.filter(s => s.sector === sector);
          return (
            <TabsContent key={sector} value={sector}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{sector} — {sectorSamples.length} amostras</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                  ) : sectorSamples.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma amostra neste setor</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Material</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Coleta</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sectorSamples.map(sample => (
                          <TableRow key={sample.id}>
                            <TableCell className="font-mono text-sm">{sample.barcode}</TableCell>
                            <TableCell>{(sample.orders as any)?.patients?.name}</TableCell>
                            <TableCell>{sample.sample_type}</TableCell>
                            <TableCell><StatusBadge status={sample.status} /></TableCell>
                            <TableCell className="text-sm">{new Date(sample.collected_at).toLocaleTimeString("pt-BR")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default Worklist;
