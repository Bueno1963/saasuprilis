import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, CheckCircle, ArrowLeft, Search } from "lucide-react";
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

const ValidarExames = () => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["results-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("results")
        .select("*, orders(order_number, patients(name))")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: examCatalog = [] } = useQuery({
    queryKey: ["exam_catalog_sectors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_catalog").select("name, sector").eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const examSectorMap = new Map(examCatalog.map(e => [e.name, e.sector]));
  const uniqueSectors = [...new Set(examCatalog.map(e => e.sector).filter(Boolean))] as string[];

  const sectorCounts = new Map<string, number>();
  for (const r of results as any[]) {
    const sector = examSectorMap.get(r.exam) || "Outros";
    sectorCounts.set(sector, (sectorCounts.get(sector) || 0) + 1);
  }

  const sectors = uniqueSectors.map((name, i) => ({
    name,
    ...SECTOR_COLORS[i % SECTOR_COLORS.length],
  }));

  const filteredResults = selectedSector
    ? (results as any[]).filter(r => (examSectorMap.get(r.exam) || "Outros") === selectedSector)
    : [];

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
      queryClient.invalidateQueries({ queryKey: ["results-pending"] });
      toast.success("Exame validado com sucesso");
    },
    onError: () => toast.error("Erro ao validar exame"),
  });

  const validateAllSector = useMutation({
    mutationFn: async () => {
      const ids = filteredResults.map((r: any) => r.id);
      if (ids.length === 0) return;
      const { error } = await supabase.from("results").update({
        status: "validated",
        validated_at: new Date().toISOString(),
        analyst_id: user?.id,
      }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results-pending"] });
      toast.success("Todos os exames do setor foram validados");
    },
    onError: () => toast.error("Erro ao validar exames"),
  });

  if (!selectedSector) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Validar Exames</h1>
          <p className="text-sm text-muted-foreground">Selecione o setor do laboratório para validar exames pendentes</p>
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
            Total: <span className="font-semibold text-foreground">{results.length}</span> exame{results.length !== 1 ? "s" : ""} pendente{results.length !== 1 ? "s" : ""} aguardando validação
          </p>
        )}
      </div>
    );
  }

  // Group by patient/order
  const patientGroups = filteredResults.reduce((acc: Record<string, { patientName: string; orderNumber: string; orderId: string; date: string; exams: string[]; resultIds: string[] }>, r: any) => {
    const key = r.order_id;
    if (!acc[key]) {
      acc[key] = {
        patientName: r.orders?.patients?.name || "—",
        orderNumber: r.orders?.order_number || "—",
        orderId: r.order_id,
        date: r.created_at,
        exams: [],
        resultIds: [],
      };
    }
    acc[key].exams.push(r.exam);
    acc[key].resultIds.push(r.id);
    return acc;
  }, {} as Record<string, { patientName: string; orderNumber: string; orderId: string; date: string; exams: string[]; resultIds: string[] }>);

  const patients = Object.values(patientGroups) as { patientName: string; orderNumber: string; orderId: string; date: string; exams: string[]; resultIds: string[] }[];

  const searchLower = searchQuery.toLowerCase();
  const filteredPatients = patients.filter(p =>
    p.patientName.toLowerCase().includes(searchLower) ||
    p.orderNumber.toLowerCase().includes(searchLower) ||
    p.exams.some(e => e.toLowerCase().includes(searchLower))
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
              {patients.length} paciente{patients.length !== 1 ? "s" : ""} · {filteredResults.length} exame{filteredResults.length !== 1 ? "s" : ""} aguardando validação
            </p>
          </div>
        </div>
        {filteredResults.length > 0 && (
          <Button onClick={() => validateAllSector.mutate()} disabled={validateAllSector.isPending}>
            <CheckCircle className="w-4 h-4 mr-2" /> Validar Todos ({filteredResults.length})
          </Button>
        )}
      </div>

      {patients.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente, pedido ou exame..."
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
              <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Nenhum exame pendente neste setor</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredPatients.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Nenhum resultado encontrado para "{searchQuery}"</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Atendimento</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Exames</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((p) => (
                  <TableRow key={p.orderId}>
                    <TableCell className="font-mono text-xs">{p.orderNumber}</TableCell>
                    <TableCell className="font-medium">{p.patientName}</TableCell>
                    <TableCell className="text-sm">{p.exams.join(", ")}</TableCell>
                    <TableCell className="text-sm">{new Date(p.date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          Promise.all(p.resultIds.map(id => validateMutation.mutateAsync(id)));
                        }}
                        disabled={validateMutation.isPending}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Validar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ValidarExames;
