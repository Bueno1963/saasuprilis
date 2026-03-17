import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Save } from "lucide-react";
import { toast } from "sonner";

const REAGENTES_PRO_IN = [
  "QUIMIURIC - ACIDO ÚRICO 1 x 500 mL",
  "QUIMIURIC - ÁCIDO ÚRICO 1 x 200 mL",
  "QUIMIALB - ALBUMINA 1 x 500 ML",
  "QUIMIALB - ALBUMINA 1 x 200 ML",
  "QUIMIBIL-D - BILIRRUBINA DIRETA R1 200 mL, R2 = 1 X 5 mL",
  "QUIMIBIL-D - BILIRRUBINA DIRETA R1 = 10 x 10 mL, R2 = 1 x 5 mL, P = 1 x 1 mL",
  "QUIMIBIL-T - BILIRRUBINA TOTAL, R1 = 200 mL, R2 = 1 X 5 mL",
  "QUIMIBIL-T - BILIRRUBINA TOTAL R1 = 10 x 10 mL, R2 = 1 x 5 mL, P = 1 x 1 mL",
  "QUIMICREA - CREATININA, Cinético Picrato Alcalino 500 mL",
  "QUIMICREA - CREATININA, Cinético Picrato Alcalino 200 mL",
  "QUIMIGLIC-OX GLICOSE OXIDASE 500 mL",
  "QUIMIGLIC-OX GLICOSE OXIDASE 200 mL",
  "QUIMIPROT - PROTEÍNA TOTAL 500 mL",
  "QUIMIPROT - PROTEÍNA TOTAL 200 mL",
  "QUIMIURE - URÉIA 500 mL",
  "QUIMIURE - URÉIA 200 mL",
  "QUIMICAL - CÁLCIO 500 mL",
  "QUIMICAL - CÁLCIO 100 mL 10 x 10 mL, P = 1 x 1 mL",
  "QUIMIFER - FERRO 250 mL R1 = 1 X 200 mL, R2 = 1 X 50 mL",
  "QUIMIFER - FERRO 100 mL R1 = 8 x 10 mL, R2 = 2 x 10 mL",
  "QUIMIFOS - FÓSFORO 500 mL",
  "QUIMIFOS - FÓSFORO 7 x 15 mL, P = 1 x 1 mL",
  "QUIMIMAG - MAGNÉSIO 500 mL",
  "QUIMIMAG - MAGNÉSIO 210 mL 14 x 15 mL, P = 1 x 1 mL",
  "QUIMICOL - COLESTEROL 500 mL",
  "QUIMICOL - COLESTEROL 200 mL",
  "QUIMICOL-H - HDL COLESTEROL ULTRA-SENSÍVEL 280 mL",
  "QUIMICOL-H - HDL COLESTEROL ULTRA-SENSÍVEL 80 mL",
  "QUIMITRI - TRIGLICÉRIDES 500 mL",
  "QUIMITRI - TRIGLICÉRIDES 200 mL",
  "QUIMIAMIL - AMILASE 200 mL",
  "QUIMIAMIL - AMILASE 60 mL",
  "QUIMIALT - ALT/TGP 500 mL",
  "QUIMIALT - ALT/TGP 200 mL",
  "QUIMIAST - AST/TGO 500 mL",
  "QUIMIAST - AST/TGO 200 mL",
  "QUIMINAC - CKNAC 250 mL, R1 = 1 x 200 mL R2 = 1 x 50 mL",
  "QUIMINAC - CKNAC 50 mL, R1 = 4 x 10 mL R2 = 2 x 5 mL",
  "QUIMIMB - CKMB, 250 mL R1 = 1 x 200 mL, R2 = 1 x 50 mL, S.C. = 1 x 1,0 mL",
  "QUIMIMB - CKMB 50 mL R1 = 4 x 10 mL, R2 = 2 x 5 mL, S.C. = 1 x 1,0 mL",
  "QUIMIDHL - LACTATO DESIDROGENASE 250 mL",
  "QUIMIDHL - LACTATO DESIDROGENASE 100 mL R1 = 8 x 10 mL, R2 = 4 x 5 mL",
  "QUIMIFAL - FOSFATASE ALCALINA 250 mL",
  "QUIMIFAL - FOSFATASE ALCALINA 125 mL",
  "QUIMIGAMA - GAMA GT 250 mL",
  "QUIMIGAMA - GAMA GT 100 mL",
  "QUIMICLORO - CLORETOS 200 mL",
  "QUIMICLORO - CLORETOS 7 x 15 mL P = 1 x 1 mL",
  "QUIMIADA - ADENOSINA DEAMINASE",
  "QUIMIPROT-U - PROTEINÚRIA 50 ml",
  "QUIMILAC - LACTATO R1 = 1 x 45mL, R2 = 1 x 5mL",
  "QUIMILIP - LIPASE R1 = 4 x 10mL, R2 = 1 x 10mL",
];

const COLUMNS = ["Limite baixo", "Média", "Limite alto", "DP esperado"];

interface NovoAnalitoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NovoAnalitoDialog = ({ open, onOpenChange }: NovoAnalitoDialogProps) => {
  const [marca, setMarca] = useState("Ebram");
  const [lote, setLote] = useState("");
  const [nivel, setNivel] = useState("N1");
  const [data, setData] = useState("");
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});

  const handleChange = (reagent: string, col: string, value: string) => {
    setValues(prev => ({
      ...prev,
      [reagent]: {
        ...(prev[reagent] || {}),
        [col]: value,
      },
    }));
  };

  const handleSave = () => {
    toast.success("Analito salvo com sucesso!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="text-lg">Novo Analito — Pro In</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Reagente Marca</label>
            <Input className="h-8 text-xs" value={marca} onChange={e => setMarca(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Lote</label>
            <Input className="h-8 text-xs" value={lote} onChange={e => setLote(e.target.value)} placeholder="Ex: ABC123" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Nível</label>
            <Input className="h-8 text-xs" value={nivel} onChange={e => setNivel(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Data</label>
            <Input className="h-8 text-xs" type="date" value={data} onChange={e => setData(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-6">
          <ScrollArea className="h-[55vh] w-full">
            <div className="min-w-[700px]">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/60">
                    <th className="sticky left-0 z-10 bg-muted/95 backdrop-blur-sm text-left p-2 min-w-[340px] font-medium text-muted-foreground border-r">
                      Reagente
                    </th>
                    {COLUMNS.map(col => (
                      <th key={col} className="p-2 text-center font-medium text-muted-foreground min-w-[110px] border-r last:border-r-0">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REAGENTES_PRO_IN.map((reagent, idx) => (
                    <tr
                      key={reagent}
                      className={`border-b hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                    >
                      <td
                        className="sticky left-0 z-10 bg-inherit backdrop-blur-sm p-2 text-[11px] font-medium text-foreground border-r whitespace-nowrap overflow-hidden text-ellipsis max-w-[340px]"
                        title={reagent}
                      >
                        {reagent}
                      </td>
                      {COLUMNS.map(col => (
                        <td key={col} className="p-0.5 border-r last:border-r-0">
                          <Input
                            className="h-7 w-full text-center text-[11px] px-1 border-0 bg-transparent focus:bg-background focus:ring-1 focus:ring-primary/40 rounded-sm"
                            value={values[reagent]?.[col] || ""}
                            onChange={e => handleChange(reagent, col, e.target.value)}
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
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            Salvar Analito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NovoAnalitoDialog;
