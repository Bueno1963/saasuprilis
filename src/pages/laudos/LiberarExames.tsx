import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Unlock, CheckCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const SECTORS = [
  { name: "Bioquímica", color: "from-blue-800 to-blue-600", glow: "shadow-blue-500/30" },
  { name: "Hematologia", color: "from-red-700 to-red-500", glow: "shadow-red-500/30" },
  { name: "Imunologia", color: "from-cyan-600 to-cyan-400", glow: "shadow-cyan-500/30" },
  { name: "Microbiologia", color: "from-orange-600 to-orange-400", glow: "shadow-orange-500/30" },
  { name: "Uroanálise", color: "from-amber-500 to-yellow-400", glow: "shadow-amber-500/30" },
  { name: "Parasitologia", color: "from-emerald-700 to-emerald-500", glow: "shadow-emerald-500/30" },
  { name: "Coagulação", color: "from-purple-700 to-purple-500", glow: "shadow-purple-500/30" },
  { name: "Hormônios", color: "from-indigo-600 to-blue-400", glow: "shadow-indigo-500/30" },
];

const LiberarExames = () => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
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

  // Fetch exam catalog to know which sector each exam belongs to
  const { data: examCatalog = [] } = useQuery({
    queryKey: ["exam_catalog_sectors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_catalog").select("name, sector").eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const examSectorMap = new Map(examCatalog.map(e => [e.name, e.sector]));

  // Count per sector
  const sectorCounts = new Map<string, number>();
  for (const r of results as any[]) {
    const sector = examSectorMap.get(r.exam) || "Outros";
    sectorCounts.set(sector, (sectorCounts.get(sector) || 0) + 1);
  }

  const filteredResults = selectedSector
    ? (results as any[]).filter(r => (examSectorMap.get(r.exam) || "Outros") === selectedSector)
    : [];

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

  const releaseAllSector = useMutation({
    mutationFn: async () => {
      const ids = filteredResults.map((r: any) => r.id);
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
      toast.success("Todos os exames do setor foram liberados");
    },
    onError: () => toast.error("Erro ao liberar exames"),
  });

  if (!selectedSector) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liberar Exames</h1>
          <p className="text-sm text-muted-foreground">Selecione o setor do laboratório para liberar exames validados</p>
        </div>

        {isLoading ? (
          <p className="text-center py-12 text-muted-foreground">Carregando...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 pt-4">
            {SECTORS.map(sector => {
              const count = sectorCounts.get(sector.name) || 0;
              return (
                <button
                  key={sector.name}
                  onClick={() => setSelectedSector(sector.name)}
                  className={cn(
                    "relative group flex flex-col items-center justify-center rounded-2xl p-6 min-h-[140px] transition-all duration-200",
                    "bg-gradient-to-b",
                    sector.color,
                    "shadow-lg hover:shadow-xl",
                    sector.glow,
                    "hover:scale-[1.04] active:scale-[0.98]",
                    "overflow-hidden"
                  )}
                >
                  {/* Glossy shine effect */}
                  <div className="absolute inset-x-0 top-0 h-[45%] rounded-t-2xl bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

                  <span className="relative text-white font-bold text-base tracking-wide text-center drop-shadow-md">
                    {sector.name}
                  </span>

                  {count > 0 && (
                    <span className="relative mt-2 inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-bold border border-white/20">
                      {count}
                    </span>
                  )}

                  {count === 0 && (
                    <span className="relative mt-2 text-white/60 text-xs">Nenhum pendente</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {results.length > 0 && (
          <p className="text-center text-sm text-muted-foreground pt-4">
            Total: <span className="font-semibold text-foreground">{results.length}</span> exame{results.length !== 1 ? "s" : ""} validado{results.length !== 1 ? "s" : ""} aguardando liberação
          </p>
        )}
      </div>
    );
  }

  const currentSector = SECTORS.find(s => s.name === selectedSector);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedSector(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{selectedSector}</h1>
            <p className="text-sm text-muted-foreground">Exames validados aguardando liberação</p>
          </div>
        </div>
        {filteredResults.length > 0 && (
          <Button onClick={() => releaseAllSector.mutate()} disabled={releaseAllSector.isPending}>
            <CheckCircle className="w-4 h-4 mr-2" /> Liberar Todos ({filteredResults.length})
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{filteredResults.length} exame{filteredResults.length !== 1 ? "s" : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Unlock className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Nenhum exame validado neste setor</p>
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
                {filteredResults.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.orders?.order_number}</TableCell>
                    <TableCell className="font-medium">{r.orders?.patients?.name}</TableCell>
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
