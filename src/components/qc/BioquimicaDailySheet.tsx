import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Save, Pencil, Plus, Trash2, FlaskConical } from "lucide-react";
import { toast } from "sonner";


const REAGENTES_BIOQUIMICA = [
  "QUIMIURIC - ÁCIDO ÚRICO 500 mL",
  "QUIMIURIC - ÁCIDO ÚRICO 200 mL",
  "QUIMIALB - ALBUMINA 500 mL",
  "QUIMIALB - ALBUMINA 200 mL",
  "QUIMIBIL-D - BILIRRUBINA DIRETA R1 200 mL, R2 5 mL",
  "QUIMIBIL-D - BILIRRUBINA DIRETA R1 10x10 mL, R2 5 mL",
  "QUIMIBIL-T - BILIRRUBINA TOTAL R1 200 mL, R2 5 mL",
  "QUIMIBIL-T - BILIRRUBINA TOTAL R1 10x10 mL, R2 5 mL",
  "QUIMICREA - CREATININA 500 mL",
  "QUIMICREA - CREATININA 200 mL",
  "QUIMIGLIC-OX - GLICOSE OXIDASE 500 mL",
  "QUIMIGLIC-OX - GLICOSE OXIDASE 200 mL",
  "QUIMIPROT - PROTEÍNA TOTAL 500 mL",
  "QUIMIPROT - PROTEÍNA TOTAL 200 mL",
  "QUIMIURE - URÉIA 500 mL",
  "QUIMIURE - URÉIA 200 mL",
  "QUIMICAL - CÁLCIO 500 mL",
  "QUIMICAL - CÁLCIO 100 mL",
  "QUIMIFER - FERRO 250 mL",
  "QUIMIFER - FERRO 100 mL",
  "QUIMIFOS - FÓSFORO 500 mL",
  "QUIMIFOS - FÓSFORO 7x15 mL",
  "QUIMIMAG - MAGNÉSIO 500 mL",
  "QUIMIMAG - MAGNÉSIO 210 mL",
  "QUIMICOL - COLESTEROL 500 mL",
  "QUIMICOL - COLESTEROL 200 mL",
  "QUIMICOL-H - HDL COLESTEROL 280 mL",
  "QUIMICOL-H - HDL COLESTEROL 80 mL",
  "QUIMITRI - TRIGLICÉRIDES 500 mL",
  "QUIMITRI - TRIGLICÉRIDES 200 mL",
  "QUIMIAMIL - AMILASE 200 mL",
  "QUIMIAMIL - AMILASE 60 mL",
  "QUIMIALT - ALT/TGP 500 mL",
  "QUIMIALT - ALT/TGP 200 mL",
  "QUIMIAST - AST/TGO 500 mL",
  "QUIMIAST - AST/TGO 200 mL",
  "QUIMINAC - CKNAC 250 mL",
  "QUIMINAC - CKNAC 50 mL",
  "QUIMIMB - CKMB 250 mL",
  "QUIMIMB - CKMB 50 mL",
  "QUIMIDHL - LACTATO DESIDROGENASE 250 mL",
  "QUIMIDHL - LACTATO DESIDROGENASE 100 mL",
  "QUIMIFAL - FOSFATASE ALCALINA 250 mL",
  "QUIMIFAL - FOSFATASE ALCALINA 125 mL",
  "QUIMIGAMA - GAMA GT 250 mL",
  "QUIMIGAMA - GAMA GT 100 mL",
  "QUIMICLORO - CLORETOS 200 mL",
  "QUIMICLORO - CLORETOS 7x15 mL",
  "QUIMIADA - ADENOSINA DEAMINASE",
  "QUIMIPROT-U - PROTEINÚRIA 50 mL",
  "QUIMILAC - LACTATO R1 45 mL, R2 5 mL",
  "QUIMILIP - LIPASE R1 4x10 mL, R2 10 mL",
  "QUIMICALIB - CALIBRADOR 5 mL",
  "QUIMICALIB - CALIBRADOR 25 mL",
  "QUIMICONTROL - SORO CONTROLE NORMAL 15 mL",
  "QUIMICONTROL - SORO CONTROLE NORMAL 50 mL",
  "QUIMICONTROL - SORO CONTROLE ANORMAL 15 mL",
  "QUIMICONTROL - SORO CONTROLE ANORMAL 50 mL",
  "CALIBRADOR ADA 1 mL",
  "SORO CONTROLE ADA (NÍVEL I e II) 2x1 mL",
];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export interface DailySheetSection {
  section: string;
  parameters: string[];
}

interface BioquimicaDailySheetProps {
  onBack: () => void;
  title?: string;
  onNovoAnalito?: () => void;
  /** If provided, renders sectioned rows instead of flat reagent list */
  parameterSections?: DailySheetSection[];
  defaultBrand?: string;
}

const BioquimicaDailySheet = ({ onBack, title = "Bioquímica", onNovoAnalito, parameterSections, defaultBrand = "EBRAM" }: BioquimicaDailySheetProps) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [entries, setEntries] = useState<Record<string, Record<number, string>>>({});
  const useSections = parameterSections && parameterSections.length > 0;
  const flatParams = useSections ? parameterSections!.flatMap(s => s.parameters) : REAGENTES_BIOQUIMICA;
  const [reagents, setReagents] = useState<string[]>(flatParams);
  const [editOpen, setEditOpen] = useState(false);
  const [editList, setEditList] = useState<string[]>([]);
  const [newReagent, setNewReagent] = useState("");
  const [brandName, setBrandName] = useState(defaultBrand);
  const [editingBrand, setEditingBrand] = useState(false);
  const [tempBrand, setTempBrand] = useState("");

  const handleChange = (reagent: string, day: number, value: string) => {
    setEntries(prev => ({
      ...prev,
      [reagent]: {
        ...(prev[reagent] || {}),
        [day]: value,
      },
    }));
  };

  const handleSave = () => {
    toast.success("Lançamentos salvos com sucesso!");
  };

  const openEditDialog = () => {
    setEditList([...reagents]);
    setNewReagent("");
    setEditOpen(true);
  };

  const handleAddReagent = () => {
    const trimmed = newReagent.trim();
    if (!trimmed) return;
    if (editList.includes(trimmed)) {
      toast.error("Reagente já existe na lista.");
      return;
    }
    setEditList(prev => [...prev, trimmed]);
    setNewReagent("");
  };

  const handleRemoveReagent = (index: number) => {
    setEditList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveReagents = () => {
    setReagents(editList);
    setEditOpen(false);
    toast.success("Lista de reagentes atualizada!");
  };

  const daysInMonth = new Date(Number(selectedYear), Number(selectedMonth) + 1, 0).getDate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Lançamentos Diários — {title}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              Reagente Marca: <strong>{brandName}</strong>
              {editingBrand ? (
                <span className="flex items-center gap-1 ml-1">
                  <Input
                    className="h-6 w-32 text-xs px-2"
                    value={tempBrand}
                    onChange={(e) => setTempBrand(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setBrandName(tempBrand.trim() || brandName);
                        setEditingBrand(false);
                        toast.success("Marca atualizada!");
                      }
                      if (e.key === "Escape") setEditingBrand(false);
                    }}
                    autoFocus
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                    setBrandName(tempBrand.trim() || brandName);
                    setEditingBrand(false);
                    toast.success("Marca atualizada!");
                  }}>
                    <Save className="h-3 w-3" />
                  </Button>
                </span>
              ) : (
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={() => { setTempBrand(brandName); setEditingBrand(true); }}>
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[80px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onNovoAnalito && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onNovoAnalito}>
              <FlaskConical className="h-3.5 w-3.5" />
              Novo Analito
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={openEditDialog}>
            <Pencil className="h-3.5 w-3.5" />
            Editar Reagentes
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" />
            Salvar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[2200px]">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/60">
                    <th className="sticky left-0 z-10 bg-muted/95 backdrop-blur-sm text-left p-2 min-w-[280px] font-medium text-muted-foreground border-r">
                      Reagente
                    </th>
                    {DAYS.filter(d => d <= daysInMonth).map(day => (
                      <th key={day} className="p-1 text-center font-medium text-muted-foreground min-w-[48px] border-r last:border-r-0">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reagents.map((reagent, idx) => (
                    <tr key={reagent} className={`border-b hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                      <td className="sticky left-0 z-10 bg-inherit backdrop-blur-sm p-2 text-[11px] font-medium text-foreground border-r whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]" title={reagent}>
                        {reagent}
                      </td>
                      {DAYS.filter(d => d <= daysInMonth).map(day => (
                        <td key={day} className="p-0.5 border-r last:border-r-0">
                          <Input
                            className="h-7 w-full text-center text-[11px] px-0.5 border-0 bg-transparent focus:bg-background focus:ring-1 focus:ring-primary/40 rounded-sm"
                            value={entries[reagent]?.[day] || ""}
                            onChange={(e) => handleChange(reagent, day, e.target.value)}
                            tabIndex={0}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Reagentes</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Nome do novo reagente..."
              value={newReagent}
              onChange={(e) => setNewReagent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddReagent()}
            />
            <Button size="sm" onClick={handleAddReagent} className="gap-1 shrink-0">
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          </div>
          <ScrollArea className="flex-1 max-h-[50vh] pr-2">
            <div className="space-y-1">
              {editList.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                  <span className="text-xs font-medium text-foreground truncate">{r}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive" onClick={() => handleRemoveReagent(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveReagents}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default BioquimicaDailySheet;
