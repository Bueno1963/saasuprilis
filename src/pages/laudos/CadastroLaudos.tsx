import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, FlaskConical } from "lucide-react";

const CadastroLaudos = () => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: exams = [] } = useQuery({
    queryKey: ["exam-catalog-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_catalog")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const sectors = [...new Set(exams.map((e) => e.sector || "Outros"))];

  const sectorCounts = sectors.reduce((acc, sector) => {
    acc[sector] = exams.filter((e) => (e.sector || "Outros") === sector).length;
    return acc;
  }, {} as Record<string, number>);

  const sectorExams = selectedSector
    ? exams.filter((e) => (e.sector || "Outros") === selectedSector)
    : [];

  const filtered = sectorExams.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cadastro de Laudos</h1>
        <p className="text-muted-foreground text-sm">Exames do catálogo organizados por setor</p>
      </div>

      {!selectedSector ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectors.map((sector) => (
            <Card
              key={sector}
              className="cursor-pointer hover:shadow-md transition-shadow border-border"
              onClick={() => setSelectedSector(sector)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">{sector}</CardTitle>
                <FlaskConical className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{sectorCounts[sector] || 0}</p>
                <p className="text-xs text-muted-foreground">exames cadastrados</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedSector(null); setSearch(""); }}>
              ← Setores
            </Button>
            <h2 className="text-lg font-semibold text-foreground">{selectedSector}</h2>
            <Badge variant="outline">{filtered.length} exames</Badge>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Valor de Referência</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Prazo (h)</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      Nenhum exame encontrado neste setor
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-mono text-xs">{exam.code}</TableCell>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell className="text-sm">{exam.material || "—"}</TableCell>
                      <TableCell className="text-sm">{exam.method || "—"}</TableCell>
                      <TableCell className="text-sm">{exam.unit || "—"}</TableCell>
                      <TableCell className="text-sm">{exam.reference_range || "—"}</TableCell>
                      <TableCell className="text-sm">{exam.equipment || "—"}</TableCell>
                      <TableCell className="text-sm text-center">{exam.turnaround_hours ?? "—"}</TableCell>
                      <TableCell className="text-sm">
                        {exam.price != null ? `R$ ${Number(exam.price).toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={exam.status === "active" ? "default" : "secondary"}>
                          {exam.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
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
