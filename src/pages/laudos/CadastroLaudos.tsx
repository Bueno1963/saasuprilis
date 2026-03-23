import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FlaskConical, Printer, Plus, Pencil, Trash2, Save, ChevronDown, ChevronRight, ListTree } from "lucide-react";
import ReportLayoutSettings from "@/components/laudos/ReportLayoutSettings";
import { toast } from "sonner";

// --- Types ---
interface ExamForm {
  code: string; name: string; material: string; method: string;
  unit: string; reference_range: string; equipment: string;
  turnaround_hours: number; price: number;
}
interface ParamForm {
  section: string; name: string; unit: string; reference_range: string; sort_order: number;
  lis_code: string; lis_name: string; equip_code: string; equip_analyte: string;
}
interface RefRangeForm {
  age_group: string; gender: string; reference_value: string; sort_order: number;
}

const AGE_GROUPS = [
  "RN (cordão)", "1 a 3 dias", "1 semana", "2 semanas", "1 mês", "2 meses",
  "3 a 6 meses", "6 meses a 2 anos", "2 a 6 anos", "6 a 12 anos",
  "12 a 18 anos", "Adulto", "> 16 anos",
];
const GENDERS = ["Ambos", "Masculino", "Feminino"];

const emptyExamForm: ExamForm = {
  code: "", name: "", material: "Sangue", method: "", unit: "",
  reference_range: "", equipment: "", turnaround_hours: 24, price: 0,
};
const emptyParamForm: ParamForm = { section: "", name: "", unit: "", reference_range: "", sort_order: 0, lis_code: "", lis_name: "", equip_code: "", equip_analyte: "" };
const emptyRefRangeForm: RefRangeForm = { age_group: "", gender: "Ambos", reference_value: "", sort_order: 0 };

const EditableSelect = ({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const filtered = options.filter((o) => o.toLowerCase().includes(value.toLowerCase()));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => { onChange(e.target.value); if (!open) setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="pr-8"
          />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1 max-h-48 overflow-y-auto" align="start" sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}>
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">Nenhuma opção</p>
        ) : filtered.map((opt) => (
          <button key={opt} type="button"
            className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => { onChange(opt); setOpen(false); }}>
            {opt}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

const CadastroLaudos = () => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [paramDialogOpen, setParamDialogOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [editingParamId, setEditingParamId] = useState<string | null>(null);
  const [examForm, setExamForm] = useState<ExamForm>(emptyExamForm);
  const [paramForm, setParamForm] = useState<ParamForm>(emptyParamForm);
  const [refRangeDialogOpen, setRefRangeDialogOpen] = useState(false);
  const [refRangeParamId, setRefRangeParamId] = useState<string | null>(null);
  const [refRangeParamName, setRefRangeParamName] = useState("");
  const [refRangeForm, setRefRangeForm] = useState<RefRangeForm>(emptyRefRangeForm);
  const [editingRefId, setEditingRefId] = useState<string | null>(null);
  const qc = useQueryClient();

  // --- Queries ---
  const { data: exams = [] } = useQuery({
    queryKey: ["exam-catalog-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_catalog").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: allParams = [] } = useQuery({
    queryKey: ["exam-parameters-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_parameters" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: allRefRanges = [] } = useQuery({
    queryKey: ["param-reference-ranges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parameter_reference_ranges" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const getParamRefRanges = (paramId: string) => allRefRanges.filter((r: any) => r.parameter_id === paramId);

  // --- Mutations ---
  const saveExamMutation = useMutation({
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
      toast.success(editingExamId ? "Exame atualizado" : "Exame adicionado");
      closeExamDialog();
    },
    onError: () => toast.error("Erro ao salvar exame"),
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exam_catalog").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-catalog-all"] });
      qc.invalidateQueries({ queryKey: ["exam-parameters-all"] });
      toast.success("Exame removido");
      if (selectedExamId) setSelectedExamId(null);
    },
    onError: () => toast.error("Erro ao remover exame"),
  });

  const saveParamMutation = useMutation({
    mutationFn: async (payload: ParamForm & { exam_id: string; id?: string }) => {
      const { id, ...rest } = payload;
      if (id) {
        const { error } = await supabase.from("exam_parameters" as any).update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exam_parameters" as any).insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-parameters-all"] });
      toast.success(editingParamId ? "Parâmetro atualizado" : "Parâmetro adicionado");
      closeParamDialog();
    },
    onError: () => toast.error("Erro ao salvar parâmetro"),
  });

  const deleteParamMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exam_parameters" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-parameters-all"] });
      toast.success("Parâmetro removido");
    },
    onError: () => toast.error("Erro ao remover parâmetro"),
  });

  const saveRefRangeMutation = useMutation({
    mutationFn: async (payload: RefRangeForm & { parameter_id: string; id?: string }) => {
      const { id, ...rest } = payload;
      if (id) {
        const { error } = await supabase.from("parameter_reference_ranges" as any).update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("parameter_reference_ranges" as any).insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["param-reference-ranges"] });
      toast.success(editingRefId ? "Referência atualizada" : "Referência adicionada");
      setEditingRefId(null);
      setRefRangeForm(emptyRefRangeForm);
    },
    onError: () => toast.error("Erro ao salvar referência"),
  });

  const deleteRefRangeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("parameter_reference_ranges" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["param-reference-ranges"] });
      toast.success("Referência removida");
    },
    onError: () => toast.error("Erro ao remover referência"),
  });

  // --- Computed ---
  const sectors = [...new Set(exams.map((e) => e.sector || "Outros"))];
  const sectorCounts = sectors.reduce((acc, s) => {
    acc[s] = exams.filter((e) => (e.sector || "Outros") === s).length;
    return acc;
  }, {} as Record<string, number>);
  const sectorExams = selectedSector ? exams.filter((e) => (e.sector || "Outros") === selectedSector) : [];

  const getExamParams = (examId: string) => allParams.filter((p: any) => p.exam_id === examId);

  // Group params by section
  const groupParamsBySections = (params: any[]) => {
    const map = new Map<string, any[]>();
    params.forEach((p) => {
      const s = p.section || "";
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(p);
    });
    return [...map.entries()].sort(([a], [b]) => {
      if (!a && b) return 1;
      if (a && !b) return -1;
      return a.localeCompare(b);
    });
  };

  // --- Dialog helpers ---
  const closeExamDialog = () => { setExamDialogOpen(false); setEditingExamId(null); setExamForm(emptyExamForm); };
  const closeParamDialog = () => { setParamDialogOpen(false); setEditingParamId(null); setParamForm(emptyParamForm); };
  const closeRefRangeDialog = () => { setRefRangeDialogOpen(false); setRefRangeParamId(null); setEditingRefId(null); setRefRangeForm(emptyRefRangeForm); };
  const openRefRangeDialog = (paramId: string, paramName: string) => { setRefRangeParamId(paramId); setRefRangeParamName(paramName); setRefRangeDialogOpen(true); };

  const openAddExam = () => { setEditingExamId(null); setExamForm(emptyExamForm); setExamDialogOpen(true); };
  const openEditExam = (exam: any) => {
    setEditingExamId(exam.id);
    setExamForm({ code: exam.code, name: exam.name, material: exam.material || "", method: exam.method || "", unit: exam.unit || "", reference_range: exam.reference_range || "", equipment: exam.equipment || "", turnaround_hours: exam.turnaround_hours ?? 24, price: exam.price ?? 0 });
    setExamDialogOpen(true);
  };
  const openAddParam = (examId: string, section?: string) => {
    setSelectedExamId(examId);
    setEditingParamId(null);
    setParamForm({ ...emptyParamForm, section: section || "" });
    setParamDialogOpen(true);
  };
  const openEditParam = (param: any) => {
    setEditingParamId(param.id);
    setParamForm({ section: param.section || "", name: param.name, unit: param.unit || "", reference_range: param.reference_range || "", sort_order: param.sort_order ?? 0, lis_code: param.lis_code || "", lis_name: param.lis_name || "", equip_code: param.equip_code || "", equip_analyte: param.equip_analyte || "" });
    setParamDialogOpen(true);
  };

  const setE = (f: keyof ExamForm, v: string | number) => setExamForm((p) => ({ ...p, [f]: v }));
  const setP = (f: keyof ParamForm, v: string | number) => setParamForm((p) => ({ ...p, [f]: v }));

  // --- Render ---
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cadastro de Parâmetros</h1>
        <p className="text-muted-foreground text-sm">Modelo de exames por setor com parâmetros para digitação</p>
      </div>

      {!selectedSector ? (
        /* Sector grid */
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
      ) : !selectedExamId ? (
        /* Exam list for sector */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedSector(null)}>← Setores</Button>
              <h2 className="text-lg font-semibold text-foreground">{selectedSector}</h2>
              <Badge variant="outline">{sectorExams.length} exames</Badge>
            </div>
            <Button size="sm" onClick={openAddExam}><Plus className="w-4 h-4 mr-1" /> Novo Exame</Button>
          </div>

          <div className="grid gap-3">
            {sectorExams.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum exame cadastrado neste setor</CardContent></Card>
            ) : sectorExams.map((exam) => {
              const params = getExamParams(exam.id);
              return (
                <Card key={exam.id} className="border-border hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelectedExamId(exam.id)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-foreground">{exam.name}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-mono">{exam.code}</span> · {exam.material || "—"} · {exam.method || "—"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{params.length} parâmetros</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditExam(exam); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteExamMutation.mutate(exam.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        /* Exam detail with parameters (laudo-style) */
        (() => {
          const exam = exams.find((e) => e.id === selectedExamId);
          if (!exam) return null;
          const params = getExamParams(exam.id);
          const sections = groupParamsBySections(params);

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedExamId(null)}>← Exames</Button>
                  <h2 className="text-lg font-semibold text-foreground">{exam.name}</h2>
                  <Badge variant="outline">{params.length} parâmetros</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => openAddParam(exam.id)}><Plus className="w-4 h-4 mr-1" /> Adicionar Parâmetro</Button>
                  <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> Imprimir</Button>
                </div>
              </div>

              <Card className="border-border print:border print:shadow-none">
                <CardContent className="p-6 space-y-0">
                  {/* Exam header */}
                  <div className="border-b-2 border-foreground pb-3 mb-4">
                    <h2 className="text-lg font-bold tracking-wide text-foreground uppercase">{exam.name}</h2>
                    <div className="flex gap-6 mt-1 text-xs text-muted-foreground">
                      <span>Material: {exam.material || "—"}</span>
                      <span>Método: {exam.method || "—"}</span>
                    </div>
                  </div>

                  <div className="font-mono text-sm">
                    {/* Column headers */}
                    <div className="flex items-center gap-1.5 pb-2 border-b border-border mb-2">
                      <span className="flex-[2] font-bold text-foreground">Parâmetro</span>
                      <span className="w-24 font-bold text-foreground text-center">Resultado</span>
                      <span className="w-12 font-bold text-foreground text-center">Unidade</span>
                      <span className="w-36 font-bold text-foreground text-center">Referências</span>
                      <span className="w-20 print:hidden" />
                    </div>

                    {params.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum parâmetro cadastrado. Adicione os campos deste exame.
                      </p>
                    ) : (
                      sections.map(([section, items]) => (
                        <div key={section || "__none"} className="mb-3">
                          {section && (
                            <div className="flex items-center gap-2 mt-3 mb-1">
                              <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">{section}:</h3>
                              <div className="flex-1 border-b border-border" />
                              <Button variant="ghost" size="icon" className="h-5 w-5 print:hidden" onClick={() => openAddParam(exam.id, section)} title="Adicionar nesta seção">
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          {items.map((param: any, idx: number) => {
                            const refRanges = getParamRefRanges(param.id);
                            const hasAgeRefs = refRanges.length > 0;
                            return (
                            <div key={param.id} className={`flex items-center gap-1.5 py-1.5 ${idx % 2 === 0 ? "bg-muted/30" : ""} px-1 rounded-sm group`}>
                              <span className="flex-[2] flex items-baseline overflow-hidden">
                                <span className="font-medium text-foreground whitespace-nowrap">{param.name}</span>
                                <span className="flex-1 mx-1 mb-0.5 overflow-hidden whitespace-nowrap text-muted-foreground tracking-[0.15em] leading-none select-none" style={{ fontSize: '10px' }}>{'·'.repeat(200)}</span>
                              </span>
                              <div className="w-24">
                                <Input className="h-7 text-xs text-center font-bold border-dashed" placeholder="___" />
                              </div>
                              <span className="w-12 text-center text-muted-foreground text-xs">{param.unit || "—"}</span>
                              <span className="w-36 text-center text-muted-foreground text-xs">
                                {hasAgeRefs ? (
                                  <Badge variant="secondary" className="text-[10px] cursor-pointer" onClick={() => openRefRangeDialog(param.id, param.name)}>
                                    {refRanges.length} faixa(s) etária(s)
                                  </Badge>
                                ) : (param.reference_range || "—")}
                              </span>
                              <div className="w-20 flex justify-center gap-0.5 print:hidden opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openRefRangeDialog(param.id, param.name)} title="Referências por faixa etária">
                                  <ListTree className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditParam(param)}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteParamMutation.mutate(param.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-border text-center">
                    <p className="text-xs text-muted-foreground">Modelo de laudo — {exam.name} — {params.length} parâmetro(s)</p>
                  </div>
                </CardContent>
              </Card>

              {/* Report Layout Settings */}
              <ReportLayoutSettings examId={exam.id} examName={exam.name} />
            </div>
          );
        })()
      )}

      {/* Exam Dialog */}
      <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
        <DialogContent className="max-w-[26rem]">
          <DialogHeader><DialogTitle>{editingExamId ? "Editar Exame" : "Novo Exame"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Código *</Label>
              <Input value={examForm.code} onChange={(e) => setE("code", e.target.value)} placeholder="HEMO" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nome *</Label>
              <Input value={examForm.name} onChange={(e) => setE("name", e.target.value)} placeholder="Hemograma Completo" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Material</Label>
              <Input value={examForm.material} onChange={(e) => setE("material", e.target.value)} placeholder="Sangue" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Método</Label>
              <Input value={examForm.method} onChange={(e) => setE("method", e.target.value)} placeholder="Automação" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Equipamento</Label>
              <Input value={examForm.equipment} onChange={(e) => setE("equipment", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Prazo (horas)</Label>
              <Input type="number" value={examForm.turnaround_hours} onChange={(e) => setE("turnaround_hours", Number(e.target.value))} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Preço (R$)</Label>
              <Input type="number" step="0.01" value={examForm.price} onChange={(e) => setE("price", Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeExamDialog}>Cancelar</Button>
            <Button onClick={() => {
              if (!examForm.code || !examForm.name) { toast.error("Código e nome são obrigatórios"); return; }
              saveExamMutation.mutate({ ...examForm, sector: selectedSector!, ...(editingExamId ? { id: editingExamId } : {}) });
            }} disabled={saveExamMutation.isPending}>
              <Save className="w-4 h-4 mr-1" /> {editingExamId ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Parameter Dialog */}
      <Dialog open={paramDialogOpen} onOpenChange={setParamDialogOpen}>
        <DialogContent className="max-w-[18rem]">
          <DialogHeader><DialogTitle>{editingParamId ? "Editar Parâmetro" : "Novo Parâmetro"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome *</Label>
              <Input value={paramForm.name} onChange={(e) => setP("name", e.target.value)} placeholder="Hemácias" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Seção</Label>
              <Input value={paramForm.section} onChange={(e) => setP("section", e.target.value)} placeholder="Ex: ERITROGRAMA" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Unidade</Label>
                <Input value={paramForm.unit} onChange={(e) => setP("unit", e.target.value)} placeholder="milhões/mm3" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor de Referência</Label>
                <EditableSelect
                  value={paramForm.reference_range}
                  onChange={(v) => setP("reference_range", v)}
                  options={[
                    "Negativo",
                    "Positivo",
                    "Normal",
                    "Reagente",
                    "Não Reagente",
                    "Límpido",
                    "Turvo",
                    "Amarelo citrino",
                    "Ausente",
                    "Presente",
                  ]}
                  placeholder="Selecionar ou digitar..."
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ordem</Label>
              <Input type="number" value={paramForm.sort_order} onChange={(e) => setP("sort_order", Number(e.target.value))} />
            </div>
            {/* Mapeamento Equipamento */}
            <div className="pt-2 border-t border-border space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mapeamento LIS ↔ Equipamento</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Código LIS</Label>
                  <Input value={paramForm.lis_code} onChange={(e) => setP("lis_code", e.target.value)} placeholder="Ex: RBC" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nome no LIS</Label>
                  <Input value={paramForm.lis_name} onChange={(e) => setP("lis_name", e.target.value)} placeholder="Ex: Hemácias" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Código Equipamento</Label>
                  <Input value={paramForm.equip_code} onChange={(e) => setP("equip_code", e.target.value)} placeholder="Ex: RBC" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Analito no Equipamento</Label>
                  <Input value={paramForm.equip_analyte} onChange={(e) => setP("equip_analyte", e.target.value)} placeholder="Ex: Red Blood Cells" />
                </div>
              </div>
            </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeParamDialog}>Cancelar</Button>
            <Button onClick={() => {
              if (!paramForm.name) { toast.error("Nome é obrigatório"); return; }
              saveParamMutation.mutate({ ...paramForm, exam_id: selectedExamId!, ...(editingParamId ? { id: editingParamId } : {}) });
            }} disabled={saveParamMutation.isPending}>
              <Save className="w-4 h-4 mr-1" /> {editingParamId ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reference Ranges by Age Dialog */}
      <Dialog open={refRangeDialogOpen} onOpenChange={(open) => !open && closeRefRangeDialog()}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListTree className="w-5 h-5" />
              Referências por Faixa Etária — {refRangeParamName}
            </DialogTitle>
          </DialogHeader>

          {refRangeParamId && (() => {
            const ranges = getParamRefRanges(refRangeParamId);
            return (
              <div className="space-y-4">
                {/* Existing ranges table */}
                {ranges.length > 0 && (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs">Faixa Etária</TableHead>
                          <TableHead className="text-xs">Sexo</TableHead>
                          <TableHead className="text-xs">Valor de Referência</TableHead>
                          <TableHead className="text-xs w-20">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ranges.map((ref: any) => (
                          <TableRow key={ref.id}>
                            <TableCell className="text-sm font-medium">{ref.age_group}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{ref.gender}</TableCell>
                            <TableCell className="text-sm font-mono">{ref.reference_value}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                  setEditingRefId(ref.id);
                                  setRefRangeForm({ age_group: ref.age_group, gender: ref.gender, reference_value: ref.reference_value, sort_order: ref.sort_order ?? 0 });
                                }}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRefRangeMutation.mutate(ref.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {ranges.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma referência por faixa etária cadastrada. Adicione abaixo.
                  </p>
                )}

                {/* Add/Edit form */}
                <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
                  <p className="text-xs font-semibold text-foreground">{editingRefId ? "Editar referência" : "Adicionar referência"}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Faixa Etária *</Label>
                      <EditableSelect
                        value={refRangeForm.age_group}
                        onChange={(v) => setRefRangeForm(p => ({ ...p, age_group: v }))}
                        options={AGE_GROUPS}
                        placeholder="Ex: Adulto"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sexo</Label>
                      <Select value={refRangeForm.gender} onValueChange={(v) => setRefRangeForm(p => ({ ...p, gender: v }))}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Valor de Referência *</Label>
                      <Input
                        value={refRangeForm.reference_value}
                        onChange={(e) => setRefRangeForm(p => ({ ...p, reference_value: e.target.value }))}
                        placeholder="Ex: 4,0 a 5,2"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {editingRefId && (
                      <Button variant="outline" size="sm" onClick={() => { setEditingRefId(null); setRefRangeForm(emptyRefRangeForm); }}>
                        Cancelar
                      </Button>
                    )}
                    <Button size="sm" onClick={() => {
                      if (!refRangeForm.age_group || !refRangeForm.reference_value) { toast.error("Faixa etária e valor são obrigatórios"); return; }
                      saveRefRangeMutation.mutate({
                        ...refRangeForm,
                        parameter_id: refRangeParamId!,
                        ...(editingRefId ? { id: editingRefId } : {}),
                      });
                    }} disabled={saveRefRangeMutation.isPending}>
                      <Save className="w-3.5 h-3.5 mr-1" /> {editingRefId ? "Salvar" : "Adicionar"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CadastroLaudos;
