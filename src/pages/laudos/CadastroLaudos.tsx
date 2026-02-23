import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FlaskConical, Printer, Plus, Pencil, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface ExamForm {
  code: string;
  name: string;
  material: string;
  method: string;
  unit: string;
  reference_range: string;
  equipment: string;
  turnaround_hours: number;
  price: number;
  section_group: string;
}

const emptyForm: ExamForm = {
  code: "", name: "", material: "Sangue", method: "", unit: "",
  reference_range: "", equipment: "", turnaround_hours: 24, price: 0, section_group: "",
};

const CadastroLaudos = () => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExamForm>(emptyForm);
  const qc = useQueryClient();

  const { data: exams = [] } = useQuery({
    queryKey: ["exam-catalog-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_catalog").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: ExamForm & { sector: string; id?: string }) => {
      const { id, ...rest } = payload;
      if (id) {
        const { error } = await supabase.from("exam_catalog").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exam_catalog").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-catalog-all"] });
      toast.success(editingId ? "Exame atualizado" : "Exame adicionado");
      closeDialog();
    },
    onError: () => toast.error("Erro ao salvar exame"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exam_catalog").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-catalog-all"] });
      toast.success("Exame removido");
    },
    onError: () => toast.error("Erro ao remover exame"),
  });

  const sectors = [...new Set(exams.map((e) => e.sector || "Outros"))];
  const sectorCounts = sectors.reduce((acc, s) => {
    acc[s] = exams.filter((e) => (e.sector || "Outros") === s).length;
    return acc;
  }, {} as Record<string, number>);
  const sectorExams = selectedSector ? exams.filter((e) => (e.sector || "Outros") === selectedSector) : [];

  // Group exams by section_group
  const groupedSections = sectorExams.reduce((acc, exam) => {
    const section = (exam as any).section_group || "";
    if (!acc.has(section)) acc.set(section, []);
    acc.get(section)!.push(exam);
    return acc;
  }, new Map<string, typeof sectorExams>());

  // Sort: named sections first (alphabetical), then ungrouped
  const sortedSections = [...groupedSections.entries()].sort(([a], [b]) => {
    if (!a && b) return 1;
    if (a && !b) return -1;
    return a.localeCompare(b);
  });

  const openAdd = (section?: string) => {
    setEditingId(null);
    setForm({ ...emptyForm, section_group: section || "" });
    setDialogOpen(true);
  };

  const openEdit = (exam: any) => {
    setEditingId(exam.id);
    setForm({
      code: exam.code, name: exam.name, material: exam.material || "",
      method: exam.method || "", unit: exam.unit || "", reference_range: exam.reference_range || "",
      equipment: exam.equipment || "", turnaround_hours: exam.turnaround_hours ?? 24,
      price: exam.price ?? 0, section_group: exam.section_group || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); };

  const handleSave = () => {
    if (!form.code || !form.name) { toast.error("Código e nome são obrigatórios"); return; }
    saveMutation.mutate({ ...form, sector: selectedSector!, ...(editingId ? { id: editingId } : {}) });
  };

  const set = (field: keyof ExamForm, v: string | number) => setForm((p) => ({ ...p, [field]: v }));

  const ExamRow = ({ exam, idx }: { exam: any; idx: number }) => (
    <div className={`flex items-center gap-2 py-1.5 ${idx % 2 === 0 ? "bg-muted/30" : ""} px-1 rounded-sm group`}>
      <span className="flex-1 flex items-baseline overflow-hidden">
        <span className="font-medium text-foreground whitespace-nowrap">{exam.name}</span>
        <span className="flex-1 border-b border-dotted border-muted-foreground mx-1 mb-0.5" />
      </span>
      <div className="w-28">
        <Input className="h-7 text-xs text-center font-bold border-dashed" placeholder="___" />
      </div>
      <span className="w-16 text-center text-muted-foreground text-xs">{exam.unit || "—"}</span>
      <span className="w-44 text-center text-muted-foreground text-xs">{exam.reference_range || "—"}</span>
      <div className="w-16 flex justify-center gap-0.5 print:hidden opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(exam)}>
          <Pencil className="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteMutation.mutate(exam.id)}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cadastro de Laudos</h1>
        <p className="text-muted-foreground text-sm">Modelo de exames por setor para digitação de resultados</p>
      </div>

      {!selectedSector ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectors.map((sector) => (
            <Card key={sector} className="cursor-pointer hover:shadow-md transition-shadow border-border" onClick={() => setSelectedSector(sector)}>
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
              <Button variant="ghost" size="sm" onClick={() => setSelectedSector(null)}>← Setores</Button>
              <h2 className="text-lg font-semibold text-foreground">{selectedSector}</h2>
              <Badge variant="outline">{sectorExams.length} exames</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => openAdd()}><Plus className="w-4 h-4 mr-1" /> Adicionar Exame</Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> Imprimir</Button>
            </div>
          </div>

          <Card className="border-border print:border print:shadow-none">
            <CardContent className="p-6 space-y-0">
              {/* Sector title */}
              <div className="border-b-2 border-foreground pb-3 mb-4">
                <h2 className="text-lg font-bold tracking-wide text-foreground uppercase">{selectedSector}</h2>
                <div className="flex gap-6 mt-1 text-xs text-muted-foreground">
                  <span>Material: {sectorExams[0]?.material || "—"}</span>
                  <span>Método: {sectorExams[0]?.method || "—"}</span>
                </div>
              </div>

              {/* Column headers */}
              <div className="font-mono text-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-border mb-2">
                  <span className="flex-1 font-bold text-foreground">Exame</span>
                  <span className="w-28 font-bold text-foreground text-center">Resultado</span>
                  <span className="w-16 font-bold text-foreground text-center">Unidade</span>
                  <span className="w-44 font-bold text-foreground text-center">Referências</span>
                  <span className="w-16 print:hidden" />
                </div>

                {sectorExams.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum exame cadastrado neste setor</p>
                ) : (
                  sortedSections.map(([section, items]) => (
                    <div key={section || "__none"} className="mb-4">
                      {section && (
                        <div className="flex items-center gap-2 mt-3 mb-1">
                          <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">{section}:</h3>
                          <div className="flex-1 border-b border-border" />
                          <Button
                            variant="ghost" size="icon" className="h-5 w-5 print:hidden"
                            onClick={() => openAdd(section)} title="Adicionar nesta seção"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      {items.map((exam, idx) => (
                        <ExamRow key={exam.id} exam={exam} idx={idx} />
                      ))}
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">Modelo de laudo — {selectedSector} — {sectorExams.length} exame(s)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Exame" : "Novo Exame"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Código *</Label>
              <Input value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="HEM01" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nome *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Hemácias" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Seção / Grupo</Label>
              <Input value={form.section_group} onChange={(e) => set("section_group", e.target.value)} placeholder="Ex: ERITROGRAMA, LEUCOGRAMA, PLAQUETAS" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Material</Label>
              <Input value={form.material} onChange={(e) => set("material", e.target.value)} placeholder="Sangue" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Método</Label>
              <Input value={form.method} onChange={(e) => set("method", e.target.value)} placeholder="Automação" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unidade</Label>
              <Input value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="mg/dL" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor de Referência</Label>
              <Input value={form.reference_range} onChange={(e) => set("reference_range", e.target.value)} placeholder="4.00 a 5.20" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Equipamento</Label>
              <Input value={form.equipment} onChange={(e) => set("equipment", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Prazo (horas)</Label>
              <Input type="number" value={form.turnaround_hours} onChange={(e) => set("turnaround_hours", Number(e.target.value))} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Preço (R$)</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-1" /> {editingId ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CadastroLaudos;
