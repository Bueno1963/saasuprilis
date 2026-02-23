import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Worklist = () => {
  const [newSector, setNewSector] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

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

  const { data: examCatalog = [] } = useQuery({
    queryKey: ["exam_catalog_sectors_worklist"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_catalog").select("sector").eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const sectors = [...new Set(examCatalog.map(e => e.sector).filter(Boolean))] as string[];

  const addSectorMutation = useMutation({
    mutationFn: async (sectorName: string) => {
      // Create a placeholder exam entry to register the new sector
      const code = `SECTOR-${sectorName.toUpperCase().replace(/\s+/g, "-").slice(0, 10)}-${Date.now().toString(36)}`;
      const { error } = await supabase.from("exam_catalog").insert({
        name: `(Setor) ${sectorName}`,
        code,
        sector: sectorName,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam_catalog_sectors_worklist"] });
      queryClient.invalidateQueries({ queryKey: ["exam_catalog_sectors"] });
      toast.success("Setor criado com sucesso");
      setNewSector("");
      setDialogOpen(false);
    },
    onError: () => toast.error("Erro ao criar setor"),
  });

  const handleAddSector = () => {
    const trimmed = newSector.trim();
    if (!trimmed) return;
    if (sectors.includes(trimmed)) {
      toast.error("Este setor já existe");
      return;
    }
    addSectorMutation.mutate(trimmed);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mapa de Trabalho</h1>
          <p className="text-sm text-muted-foreground">Organização de amostras por setor e equipamento</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Novo Setor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Setor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input
                placeholder="Nome do setor (ex: Hormônios)"
                value={newSector}
                onChange={e => setNewSector(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddSector()}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleAddSector} disabled={addSectorMutation.isPending || !newSector.trim()}>
                Criar Setor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sectors.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">Nenhum setor cadastrado. Crie um setor para começar.</p>
      ) : (
        <Tabs defaultValue={sectors[0]}>
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
      )}
    </div>
  );
};

export default Worklist;
