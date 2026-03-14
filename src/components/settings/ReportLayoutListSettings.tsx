import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Search, LayoutTemplate, FlaskConical, ChevronRight, Plus, Tag } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import ReportLayoutSettings from "@/components/laudos/ReportLayoutSettings";

interface Props {
  onBack: () => void;
}

const ReportLayoutListSettings = ({ onBack }: Props) => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<{ id: string; name: string } | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [labelSearch, setLabelSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: exams = [] } = useQuery({
    queryKey: ["exam-catalog-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_catalog").select("id, name, code, sector, status, show_on_label").order("name");
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
  const activeExams = exams.filter((e) => e.status === "active");

  const sectorMap = new Map<string, typeof activeExams>();
  for (const exam of activeExams) {
    const sector = exam.sector || "Outros";
    if (!sectorMap.has(sector)) sectorMap.set(sector, []);
    sectorMap.get(sector)!.push(exam);
  }
  const sectors = [...sectorMap.keys()].sort();

  // Exams NOT in the current sector (candidates to add)
  const otherExams = useMemo(() => {
    if (!selectedSector) return [];
    return activeExams.filter((e) => (e.sector || "Outros") !== selectedSector);
  }, [activeExams, selectedSector]);

  const filteredOtherExams = useMemo(() => {
    if (!groupSearch) return otherExams;
    const q = groupSearch.toLowerCase();
    return otherExams.filter((e) => e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q));
  }, [otherExams, groupSearch]);

  const groupMutation = useMutation({
    mutationFn: async () => {
      if (selectedIds.size === 0 || !selectedSector) return;
      const ids = [...selectedIds];
      const { error } = await supabase
        .from("exam_catalog")
        .update({ sector: selectedSector })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-catalog-all"] });
      toast.success(`${selectedIds.size} exame(s) agrupado(s) ao setor ${selectedSector}`);
      setGroupDialogOpen(false);
      setSelectedIds(new Set());
      setGroupSearch("");
    },
    onError: () => toast.error("Erro ao agrupar exames"),
  });

  const labelToggleMutation = useMutation({
    mutationFn: async ({ examId, showOnLabel }: { examId: string; showOnLabel: boolean }) => {
      const { error } = await supabase
        .from("exam_catalog")
        .update({ show_on_label: showOnLabel } as any)
        .eq("id", examId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-catalog-all"] });
    },
    onError: () => toast.error("Erro ao atualizar configuração de etiqueta"),
  });

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // --- Exam detail view ---
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

  // --- Exam list for selected sector ---
  if (selectedSector) {
    const sectorExams = sectorMap.get(selectedSector) || [];
    const filtered = sectorExams.filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.code.toLowerCase().includes(search.toLowerCase())
    );
    const configuredCount = sectorExams.filter((e) => layoutExamIds.has(e.id)).length;

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedSector(null); setSearch(""); }}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Setores
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{selectedSector}</h1>
              <p className="text-sm text-muted-foreground">
                {sectorExams.length} exame(s) · {configuredCount} com layout configurado
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { setLabelDialogOpen(true); setLabelSearch(""); }}>
              <Tag className="w-4 h-4 mr-1" /> Definir Exame por Etiqueta
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setGroupDialogOpen(true); setSelectedIds(new Set()); setGroupSearch(""); }}>
              <Plus className="w-4 h-4 mr-1" /> Agrupar Exame ao Setor
            </Button>
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
                          <span className="font-mono">{exam.code}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={hasLayout ? "default" : "outline"} className="text-xs">
                        {hasLayout ? "Configurado" : "Padrão"}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Dialog: Agrupar exame ao setor */}
        <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Agrupar Exames ao Setor — {selectedSector}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Selecione exames de outros setores para mover para <strong>{selectedSector}</strong>.
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar exame..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[40vh] border border-border rounded-lg p-2">
              {filteredOtherExams.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">Nenhum exame disponível</p>
              ) : (
                filteredOtherExams.map((exam) => (
                  <label
                    key={exam.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedIds.has(exam.id)}
                      onCheckedChange={() => toggleId(exam.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{exam.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{exam.code}</span> · {exam.sector || "Outros"}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">{selectedIds.size} selecionado(s)</p>
              <Button
                size="sm"
                disabled={selectedIds.size === 0 || groupMutation.isPending}
                onClick={() => groupMutation.mutate()}
              >
                Agrupar ao Setor
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog: Definir exame por etiqueta */}
        <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Definir Exame por Etiqueta — {selectedSector}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Ative ou desative quais exames deste setor aparecem nas etiquetas de amostras.
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar exame..."
                value={labelSearch}
                onChange={(e) => setLabelSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[40vh] border border-border rounded-lg p-2">
              {(() => {
                const sExams = sectorMap.get(selectedSector!) || [];
                const q = labelSearch.toLowerCase();
                const filtered = q
                  ? sExams.filter((e) => e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q))
                  : sExams;
                if (filtered.length === 0) {
                  return <p className="text-center text-muted-foreground py-6 text-sm">Nenhum exame encontrado</p>;
                }
                return filtered.map((exam) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{exam.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{exam.code}</span>
                      </p>
                    </div>
                    <Switch
                      checked={(exam as any).show_on_label !== false}
                      onCheckedChange={(checked) =>
                        labelToggleMutation.mutate({ examId: exam.id, showOnLabel: checked })
                      }
                    />
                  </div>
                ));
              })()}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // --- Sector grid ---
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cadastro de Layout por Setor</h1>
          <p className="text-sm text-muted-foreground">Configure o layout de impressão do laudo para cada exame, organizado por setor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectors.map((sector) => {
          const sectorExams = sectorMap.get(sector) || [];
          const configuredCount = sectorExams.filter((e) => layoutExamIds.has(e.id)).length;
          return (
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
                <p className="text-2xl font-bold text-foreground">{sectorExams.length}</p>
                <p className="text-xs text-muted-foreground">
                  exames · {configuredCount} configurado(s)
                </p>
              </CardContent>
            </Card>
          );
        })}
        {sectors.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">Nenhum setor com exames ativos</p>
        )}
      </div>
    </div>
  );
};

export default ReportLayoutListSettings;
