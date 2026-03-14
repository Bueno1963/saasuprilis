import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, LayoutTemplate } from "lucide-react";
import ReportLayoutSettings from "@/components/laudos/ReportLayoutSettings";

interface Props {
  onBack: () => void;
}

const ReportLayoutListSettings = ({ onBack }: Props) => {
  const [search, setSearch] = useState("");
  const [selectedExam, setSelectedExam] = useState<{ id: string; name: string } | null>(null);

  const { data: exams = [] } = useQuery({
    queryKey: ["exam-catalog-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_catalog").select("id, name, code, sector, status").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: layouts = [] } = useQuery({
    queryKey: ["report-layouts-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("report_layouts").select("exam_id");
      if (error) throw error;
      return data;
    },
  });

  const layoutExamIds = new Set(layouts.map((l: any) => l.exam_id));

  const filtered = exams.filter(
    (e) =>
      e.status === "active" &&
      (e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.code.toLowerCase().includes(search.toLowerCase()))
  );

  if (selectedExam) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedExam(null)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar aos exames
        </Button>
        <ReportLayoutSettings examId={selectedExam.id} examName={selectedExam.name} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cadastro de Layout</h1>
          <p className="text-sm text-muted-foreground">Configure o layout de impressão do laudo para cada exame</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar exame por nome ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-2">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum exame encontrado</p>
        ) : (
          filtered.map((exam) => {
            const hasLayout = layoutExamIds.has(exam.id);
            return (
              <Card
                key={exam.id}
                className="cursor-pointer hover:shadow-sm transition-shadow border-border"
                onClick={() => setSelectedExam({ id: exam.id, name: exam.name })}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LayoutTemplate className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium text-foreground text-sm">{exam.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{exam.code}</span> · {exam.sector || "—"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={hasLayout ? "default" : "outline"} className="text-xs">
                    {hasLayout ? "Configurado" : "Padrão"}
                  </Badge>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReportLayoutListSettings;
