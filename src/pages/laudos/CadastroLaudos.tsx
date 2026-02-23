import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlaskConical, Printer } from "lucide-react";

const CadastroLaudos = () => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

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

  // Group exams by name prefix to create sections (e.g. all hemograma params together)
  const groupExams = (examList: typeof sectorExams) => {
    // For now, each exam is its own entry in the template
    return examList;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cadastro de Laudos</h1>
        <p className="text-muted-foreground text-sm">Modelo de exames por setor para digitação de resultados</p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedSector(null)}>
                ← Setores
              </Button>
              <h2 className="text-lg font-semibold text-foreground">{selectedSector}</h2>
              <Badge variant="outline">{sectorExams.length} exames</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1" /> Imprimir
            </Button>
          </div>

          {/* Laudo-style template */}
          <Card className="border-border print:border print:shadow-none">
            <CardContent className="p-6 space-y-1">
              {/* Header */}
              <div className="border-b-2 border-foreground pb-3 mb-4">
                <h2 className="text-lg font-bold tracking-wide text-foreground uppercase">
                  {selectedSector}
                </h2>
              </div>

              {/* Exam rows in laudo style */}
              <div className="font-mono text-sm space-y-0">
                {/* Table header */}
                <div className="flex items-center gap-2 pb-2 border-b border-border mb-2">
                  <span className="flex-1 font-bold text-foreground">Exame</span>
                  <span className="w-20 font-bold text-foreground text-center">Material</span>
                  <span className="w-20 font-bold text-foreground text-center">Método</span>
                  <span className="w-28 font-bold text-foreground text-center">Resultado</span>
                  <span className="w-16 font-bold text-foreground text-center">Unidade</span>
                  <span className="w-44 font-bold text-foreground text-center">Referências</span>
                </div>

                {groupExams(sectorExams).map((exam, idx) => (
                  <div
                    key={exam.id}
                    className={`flex items-center gap-2 py-1.5 ${idx % 2 === 0 ? "bg-muted/30" : ""} px-1 rounded-sm`}
                  >
                    {/* Exam name with dotted leader */}
                    <span className="flex-1 flex items-baseline overflow-hidden">
                      <span className="font-medium text-foreground whitespace-nowrap">{exam.name}</span>
                      <span className="flex-1 border-b border-dotted border-muted-foreground mx-1 mb-0.5" />
                    </span>

                    {/* Material */}
                    <span className="w-20 text-center text-muted-foreground text-xs">
                      {exam.material || "—"}
                    </span>

                    {/* Method */}
                    <span className="w-20 text-center text-muted-foreground text-xs">
                      {exam.method || "—"}
                    </span>

                    {/* Result input */}
                    <div className="w-28">
                      <Input
                        className="h-7 text-xs text-center font-bold border-dashed"
                        placeholder="___"
                      />
                    </div>

                    {/* Unit */}
                    <span className="w-16 text-center text-muted-foreground text-xs">
                      {exam.unit || "—"}
                    </span>

                    {/* Reference range */}
                    <span className="w-44 text-center text-muted-foreground text-xs">
                      {exam.reference_range || "—"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-6 mt-6 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Modelo de laudo — {selectedSector} — {sectorExams.length} exame(s) cadastrado(s)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CadastroLaudos;
