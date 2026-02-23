import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, FileText, ChevronRight } from "lucide-react";

const SECTORS = ["Bioquímica", "Hematologia", "Imunologia", "Microbiologia", "Uroanálise", "Hormônios"];

const CadastroLaudos = () => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: results = [] } = useQuery({
    queryKey: ["results-all-sectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("results")
        .select("*, orders!inner(order_number, patient_id, doctor_name, insurance, patients!inner(name, cpf, birth_date, gender))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: samples = [] } = useQuery({
    queryKey: ["samples-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("samples").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Group by sector using sample sector or fallback
  const getSector = (result: any) => {
    if (result.sample_id) {
      const sample = samples.find((s: any) => s.id === result.sample_id);
      if (sample) return sample.sector;
    }
    return "Bioquímica";
  };

  const sectorCounts = SECTORS.reduce((acc, sector) => {
    acc[sector] = results.filter((r: any) => getSector(r) === sector).length;
    return acc;
  }, {} as Record<string, number>);

  const sectorResults = selectedSector
    ? results.filter((r: any) => getSector(r) === selectedSector)
    : [];

  // Group by order (patient)
  const patientGroups = sectorResults.reduce((acc: any[], r: any) => {
    const existing = acc.find((g) => g.orderId === r.order_id);
    if (existing) {
      existing.exams.push(r.exam);
      existing.results.push(r);
    } else {
      acc.push({
        orderId: r.order_id,
        orderNumber: r.orders?.order_number || "",
        patientName: r.orders?.patients?.name || "",
        cpf: r.orders?.patients?.cpf || "",
        exams: [r.exam],
        results: [r],
        date: r.created_at,
        status: r.status,
      });
    }
    return acc;
  }, []);

  const filteredPatients = patientGroups.filter(
    (g) =>
      g.patientName.toLowerCase().includes(search.toLowerCase()) ||
      g.orderNumber.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (results: any[]) => {
    const allReleased = results.every((r: any) => r.status === "released");
    const allValidated = results.every((r: any) => r.status === "validated" || r.status === "released");
    const hasPending = results.some((r: any) => r.status === "pending");
    if (allReleased) return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Liberado</Badge>;
    if (allValidated) return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Validado</Badge>;
    if (hasPending) return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Pendente</Badge>;
    return <Badge variant="secondary">Em andamento</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cadastro de Laudos</h1>
        <p className="text-muted-foreground text-sm">Visualize todos os laudos organizados por setor</p>
      </div>

      {!selectedSector ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTORS.map((sector) => (
            <Card
              key={sector}
              className="cursor-pointer hover:shadow-md transition-shadow border-border"
              onClick={() => setSelectedSector(sector)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">{sector}</CardTitle>
                <FileText className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{sectorCounts[sector] || 0}</p>
                <p className="text-xs text-muted-foreground">laudos registrados</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedSector(null)}>
              ← Setores
            </Button>
            <h2 className="text-lg font-semibold text-foreground">{selectedSector}</h2>
            <Badge variant="outline">{filteredPatients.length} laudos</Badge>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente ou nº pedido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Exames</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum laudo encontrado neste setor
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((group) => (
                    <TableRow key={group.orderId}>
                      <TableCell className="font-mono text-xs">{group.orderNumber}</TableCell>
                      <TableCell className="font-medium">{group.patientName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{group.cpf}</TableCell>
                      <TableCell className="text-sm">{group.exams.join(", ")}</TableCell>
                      <TableCell>{getStatusBadge(group.results)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(group.date).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CadastroLaudos;
