import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Unlock, CheckCircle, ArrowLeft, Search } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const SECTOR_COLORS = [
  { color: "from-blue-800 to-blue-600", glow: "shadow-blue-500/30" },
  { color: "from-red-700 to-red-500", glow: "shadow-red-500/30" },
  { color: "from-cyan-600 to-cyan-400", glow: "shadow-cyan-500/30" },
  { color: "from-orange-600 to-orange-400", glow: "shadow-orange-500/30" },
  { color: "from-amber-500 to-yellow-400", glow: "shadow-amber-500/30" },
  { color: "from-emerald-700 to-emerald-500", glow: "shadow-emerald-500/30" },
  { color: "from-purple-700 to-purple-500", glow: "shadow-purple-500/30" },
  { color: "from-indigo-600 to-blue-400", glow: "shadow-indigo-500/30" },
  { color: "from-rose-600 to-pink-400", glow: "shadow-rose-500/30" },
  { color: "from-teal-700 to-teal-500", glow: "shadow-teal-500/30" },
  { color: "from-slate-700 to-slate-500", glow: "shadow-slate-500/30" },
  { color: "from-lime-600 to-lime-400", glow: "shadow-lime-500/30" },
];

const LiberarExames = () => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  // Get unique sectors from catalog
  const uniqueSectors = [...new Set(examCatalog.map(e => e.sector).filter(Boolean))] as string[];

  // Count per sector
  const sectorCounts = new Map<string, number>();
  for (const r of results as any[]) {
    const sector = examSectorMap.get(r.exam) || "Outros";
    sectorCounts.set(sector, (sectorCounts.get(sector) || 0) + 1);
  }

  // Build dynamic sectors with colors
  const sectors = uniqueSectors.map((name, i) => ({
    name,
    ...SECTOR_COLORS[i % SECTOR_COLORS.length],
  }));

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
            {sectors.map(sector => {
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

  // Group results by patient
  const patientGroups = filteredResults.reduce((acc: Record<string, { patientName: string; orderNumber: string; orderId: string; results: any[] }>, r: any) => {
    const key = r.order_id;
    if (!acc[key]) {
      acc[key] = {
        patientName: r.orders?.patients?.name || "—",
        orderNumber: r.orders?.order_number || "—",
        orderId: r.order_id,
        results: [],
      };
    }
    acc[key].results.push(r);
    return acc;
  }, {});

  const patients = Object.values(patientGroups) as { patientName: string; orderNumber: string; orderId: string; results: any[] }[];

  const searchLower = searchQuery.toLowerCase();
  const filteredPatients = patients.filter(p =>
    p.patientName.toLowerCase().includes(searchLower) ||
    p.orderNumber.toLowerCase().includes(searchLower)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedSector(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{selectedSector}</h1>
            <p className="text-sm text-muted-foreground">
              {patients.length} paciente{patients.length !== 1 ? "s" : ""} · {filteredResults.length} exame{filteredResults.length !== 1 ? "s" : ""} aguardando liberação
            </p>
          </div>
        </div>
        {filteredResults.length > 0 && (
          <Button onClick={() => releaseAllSector.mutate()} disabled={releaseAllSector.isPending}>
            <CheckCircle className="w-4 h-4 mr-2" /> Liberar Todos ({filteredResults.length})
          </Button>
        )}
      </div>

      {patients.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente ou pedido..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {patients.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <Unlock className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Nenhum exame validado neste setor</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredPatients.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Nenhum paciente encontrado para "{searchQuery}"</p>
      ) : (
        <div className="space-y-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.orderId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{patient.patientName}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">Pedido: {patient.orderNumber}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const ids = patient.results.map((r: any) => r.id);
                      Promise.all(ids.map((id: string) => releaseMutation.mutateAsync(id)));
                    }}
                    disabled={releaseMutation.isPending}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Liberar Paciente ({patient.results.length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exame</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Ref.</TableHead>
                      <TableHead>Flag</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.results.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.exam}</TableCell>
                        <TableCell className="font-mono font-semibold">{r.value} {r.unit}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.reference_range}</TableCell>
                        <TableCell><StatusBadge status={r.flag} /></TableCell>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiberarExames;
